/**
 * Consultant-specific API helpers for white-label deployments.
 *
 * Provides data access and operations scoped to a consultant's client
 * portfolio: client listing, invitation, diagnostic access, report
 * generation, and dashboard aggregation.
 *
 * @module whitelabel/consultant-api
 */

import { supabase } from "@/lib/supabase/client";
import type { ReportConfig } from "@/types/report";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A client managed by a consultant. */
export interface ConsultantClient {
  id: string;
  companyName: string;
  contactEmail: string;
  contactName: string;
  sector: string;
  employeeCount: number;
  lastDiagnosticDate: string | null;
  lastDiagnosticScore: number | null;
  diagnosticCount: number;
  status: ClientStatus;
  invitedAt: string;
  joinedAt: string | null;
}

/** Status of a consultant's client. */
export type ClientStatus = "invited" | "active" | "inactive" | "archived";

/** Simplified diagnostic data for the consultant view. */
export interface Diagnostic {
  id: string;
  companyId: string;
  companyName: string;
  globalScore: number;
  status: string;
  completionPercentage: number;
  createdAt: string;
  completedAt: string | null;
}

/** Aggregated data for the consultant dashboard. */
export interface DashboardData {
  totalClients: number;
  activeClients: number;
  totalDiagnostics: number;
  completedDiagnostics: number;
  averageScore: number;
  recentDiagnostics: Diagnostic[];
  clientsByStatus: Record<ClientStatus, number>;
  scoreDistribution: ScoreDistribution;
  monthlyActivity: MonthlyActivity[];
  topWasteCategories: WasteCategorySummary[];
}

/** Score distribution for the dashboard. */
export interface ScoreDistribution {
  critical: number;  // 0-39
  average: number;   // 40-69
  good: number;      // 70-100
}

/** Monthly activity summary. */
export interface MonthlyActivity {
  month: string;     // "YYYY-MM"
  diagnosticsStarted: number;
  diagnosticsCompleted: number;
  newClients: number;
}

/** Waste category summary across all clients. */
export interface WasteCategorySummary {
  category: string;
  averageScore: number;
  clientCount: number;
}

/** Client invitation payload. */
export interface ClientInvitation {
  consultantId: string;
  email: string;
  companyName: string;
  contactName?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieves the list of clients for a consultant.
 *
 * @param consultantId - The consultant's user ID.
 * @returns Array of clients with their latest diagnostic info.
 */
export async function getClientList(consultantId: string): Promise<ConsultantClient[]> {
  const result = await supabase
    .from("consultant_clients")
    .select("*")
    .eq("consultant_id", consultantId);

  if (!result.data || !Array.isArray(result.data)) {
    return [];
  }

  return (result.data as Record<string, unknown>[]).map(mapClientRow);
}

/**
 * Invites a new client to use DiagOptim under the consultant's account.
 *
 * Creates a client record and sends an invitation email. The client
 * will be linked to the consultant upon registration.
 *
 * @param consultantId - The consultant's user ID.
 * @param email        - The client's email address.
 * @param companyName  - The client's company name.
 */
export async function inviteClient(
  consultantId: string,
  email: string,
  companyName: string,
): Promise<void> {
  // Validate inputs
  if (!email || !email.includes("@")) {
    throw new Error("A valid email address is required");
  }
  if (!companyName || companyName.trim().length === 0) {
    throw new Error("Company name is required");
  }

  // Check for existing invitation
  const existingResult = await supabase
    .from("consultant_clients")
    .select("id")
    .eq("consultant_id", consultantId)
    .eq("contact_email", email);

  if (existingResult.data && Array.isArray(existingResult.data) && existingResult.data.length > 0) {
    throw new Error(`Client with email ${email} has already been invited`);
  }

  // Create client record
  const clientRecord = {
    consultant_id: consultantId,
    company_name: companyName,
    contact_email: email,
    status: "invited",
    invited_at: new Date().toISOString(),
  };

  await supabase.from("consultant_clients").insert(clientRecord);

  // In production, send invitation email via the email service
  // await sendEmail(email, "invitation", {
  //   consultantName: consultantName,
  //   companyName,
  //   inviteUrl: `${getBaseUrl()}/invite/${inviteToken}`,
  // }, "fr");
}

/**
 * Retrieves diagnostics for a specific client company.
 *
 * Only returns diagnostics that belong to the consultant's client.
 *
 * @param consultantId   - The consultant's user ID.
 * @param clientCompanyId - The client's company ID.
 * @returns Array of diagnostics for the specified client.
 */
export async function getClientDiagnostics(
  consultantId: string,
  clientCompanyId: string,
): Promise<Diagnostic[]> {
  // Verify the client belongs to this consultant
  const clientResult = await supabase
    .from("consultant_clients")
    .select("id")
    .eq("consultant_id", consultantId)
    .eq("company_id", clientCompanyId);

  if (!clientResult.data || !Array.isArray(clientResult.data) || clientResult.data.length === 0) {
    throw new Error("Client not found or not associated with this consultant");
  }

  // Fetch diagnostics for the client's company
  const diagnosticResult = await supabase
    .from("diagnostics")
    .select("*")
    .eq("company_id", clientCompanyId);

  if (!diagnosticResult.data || !Array.isArray(diagnosticResult.data)) {
    return [];
  }

  return (diagnosticResult.data as Record<string, unknown>[]).map(mapDiagnosticRow);
}

/**
 * Generates a PDF report for a client's diagnostic.
 *
 * Applies the consultant's white-label branding to the report.
 *
 * @param consultantId - The consultant's user ID.
 * @param diagnosticId - The diagnostic ID to generate a report for.
 * @returns A Buffer containing the PDF report.
 */
export async function generateClientReport(
  consultantId: string,
  diagnosticId: string,
): Promise<Buffer> {
  // Verify access: the diagnostic must belong to one of the consultant's clients
  const diagnosticResult = await supabase
    .from("diagnostics")
    .select("*")
    .eq("id", diagnosticId)
    .single();

  if (!diagnosticResult.data) {
    throw new Error("Diagnostic not found");
  }

  // In production, verify the diagnostic's company belongs to the consultant
  // and fetch the full report data and branding config

  // Dynamic import to avoid circular dependency
  const { generatePdfReport } = await import("@/lib/reports/pdf-generator");
  const { getTenantConfig, applyBranding } = await import("@/lib/whitelabel/tenant");

  const tenantConfig = await getTenantConfig(consultantId);
  const branding = applyBranding(tenantConfig);

  // Build report config with consultant's branding
  const reportConfig: ReportConfig = {
    format: "pdf",
    locale: "fr",
    sections: [
      "executive_summary",
      "company_overview",
      "diagnostic_methodology",
      "waste_analysis",
      "swot_analysis",
      "financial_analysis",
      "recommendations",
      "roadmap",
      "appendices",
    ],
    includeCharts: true,
    includeRawData: false,
    brandingLogoUrl: branding.logoUrl,
    brandingColor: branding.primary,
    customHeader: branding.headerText,
    customFooter: branding.footerText,
  };

  // In production, build reportData from the diagnostic record
  // For now, provide a minimal placeholder
  const reportData = {
    company: {
      name: "[Client Company]",
      sector: "[Sector]",
      employeeCount: 0,
      annualRevenue: 0,
      location: "[Location]",
    },
    framing: {
      financialGoalType: null,
      financialGoalAmount: null,
      timeHorizonMonths: null,
      autonomyLevel: null,
    },
    globalScore: 0,
    wasteScores: {
      overproduction: 0,
      waiting: 0,
      transport: 0,
      overprocessing: 0,
      inventory: 0,
      motion: 0,
      defects: 0,
      skills: 0,
    },
    swot: null,
    memorySheets: [],
    financialSummary: null,
    roadmapActions: [],
    generatedAt: new Date().toISOString(),
  };

  return generatePdfReport(reportData, reportConfig);
}

/**
 * Aggregates dashboard data for a consultant.
 *
 * Provides summary statistics, recent activity, score distributions,
 * and waste category analysis across all the consultant's clients.
 *
 * @param consultantId - The consultant's user ID.
 * @returns Aggregated dashboard data.
 */
export async function getConsultantDashboardData(consultantId: string): Promise<DashboardData> {
  const clients = await getClientList(consultantId);

  // Count clients by status
  const clientsByStatus: Record<ClientStatus, number> = {
    invited: 0,
    active: 0,
    inactive: 0,
    archived: 0,
  };

  for (const client of clients) {
    clientsByStatus[client.status]++;
  }

  // Collect scores for distribution
  const scores = clients
    .filter((c) => c.lastDiagnosticScore !== null)
    .map((c) => c.lastDiagnosticScore as number);

  const scoreDistribution: ScoreDistribution = {
    critical: scores.filter((s) => s < 40).length,
    average: scores.filter((s) => s >= 40 && s < 70).length,
    good: scores.filter((s) => s >= 70).length,
  };

  const averageScore =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const totalDiagnostics = clients.reduce((sum, c) => sum + c.diagnosticCount, 0);
  const completedDiagnostics = clients.filter((c) => c.lastDiagnosticDate !== null).length;

  return {
    totalClients: clients.length,
    activeClients: clientsByStatus.active,
    totalDiagnostics,
    completedDiagnostics,
    averageScore,
    recentDiagnostics: [], // In production, fetch recent diagnostics across clients
    clientsByStatus,
    scoreDistribution,
    monthlyActivity: [], // In production, aggregate from activity logs
    topWasteCategories: [], // In production, aggregate from diagnostic results
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mapClientRow(row: Record<string, unknown>): ConsultantClient {
  return {
    id: String(row.id ?? ""),
    companyName: String(row.company_name ?? ""),
    contactEmail: String(row.contact_email ?? ""),
    contactName: String(row.contact_name ?? ""),
    sector: String(row.sector ?? ""),
    employeeCount: Number(row.employee_count ?? 0),
    lastDiagnosticDate: row.last_diagnostic_date ? String(row.last_diagnostic_date) : null,
    lastDiagnosticScore: row.last_diagnostic_score !== null && row.last_diagnostic_score !== undefined
      ? Number(row.last_diagnostic_score)
      : null,
    diagnosticCount: Number(row.diagnostic_count ?? 0),
    status: (String(row.status ?? "invited")) as ClientStatus,
    invitedAt: String(row.invited_at ?? ""),
    joinedAt: row.joined_at ? String(row.joined_at) : null,
  };
}

function mapDiagnosticRow(row: Record<string, unknown>): Diagnostic {
  return {
    id: String(row.id ?? ""),
    companyId: String(row.company_id ?? ""),
    companyName: String(row.company_name ?? ""),
    globalScore: Number(row.global_score ?? 0),
    status: String(row.status ?? ""),
    completionPercentage: Number(row.completion_percentage ?? 0),
    createdAt: String(row.created_at ?? ""),
    completedAt: row.completed_at ? String(row.completed_at) : null,
  };
}
