import type { WasteCategory, WasteScores, SWOTData, DiagnosticFraming } from "./diagnostic";

// ---------------------------------------------------------------------------
// Report generation types
// ---------------------------------------------------------------------------

export type ReportFormat = "pdf" | "docx" | "html";
export type ReportLocale = "fr" | "en";

export type ReportStatus =
  | "queued"
  | "generating"
  | "completed"
  | "failed";

// ---------------------------------------------------------------------------
// Report section definitions
// ---------------------------------------------------------------------------

export type ReportSectionType =
  | "executive_summary"
  | "company_overview"
  | "diagnostic_methodology"
  | "waste_analysis"
  | "swot_analysis"
  | "financial_analysis"
  | "recommendations"
  | "roadmap"
  | "appendices";

export interface ReportSection {
  type: ReportSectionType;
  title: string;
  content: string; // Rendered HTML or markdown
  order: number;
  visible: boolean;
  pageBreakBefore: boolean;
}

// ---------------------------------------------------------------------------
// Report configuration (user-selectable options)
// ---------------------------------------------------------------------------

export interface ReportConfig {
  format: ReportFormat;
  locale: ReportLocale;
  sections: ReportSectionType[];
  includeCharts: boolean;
  includeRawData: boolean;
  brandingLogoUrl: string | null;
  brandingColor: string | null; // hex color
  customHeader: string | null;
  customFooter: string | null;
}

// ---------------------------------------------------------------------------
// Generated report record
// ---------------------------------------------------------------------------

export interface Report {
  id: string;
  companyId: string;
  diagnosticId: string;
  config: ReportConfig;
  status: ReportStatus;
  fileUrl: string | null;
  fileSizeBytes: number | null;
  generatedAt: string | null;
  expiresAt: string | null;
  errorMessage: string | null;
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Memory Sheet (Fiche mémo) – per-waste-category summary
// ---------------------------------------------------------------------------

export interface MemorySheet {
  id: string;
  diagnosticId: string;
  wasteCategory: WasteCategory;
  title: string;
  score: number; // 0–100
  summary: string;
  keyFindings: string[];
  recommendations: MemorySheetRecommendation[];
  relatedMethodologies: string[];
  estimatedGainRange: { min: number; max: number }; // EUR
  createdAt: string;
}

export interface MemorySheetRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  effortLevel: "low" | "medium" | "high";
  estimatedGain: number;
  timelineWeeks: number;
}

// ---------------------------------------------------------------------------
// Report data payload – aggregated data fed to the report generator
// ---------------------------------------------------------------------------

export interface ReportData {
  company: {
    name: string;
    sector: string;
    employeeCount: number;
    annualRevenue: number;
    location: string;
  };
  framing: DiagnosticFraming;
  globalScore: number;
  wasteScores: WasteScores;
  swot: SWOTData | null;
  memorySheets: MemorySheet[];
  financialSummary: FinancialSummary | null;
  roadmapActions: RoadmapActionSummary[];
  generatedAt: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  estimatedWasteCost: number;
  potentialSavings: { min: number; max: number };
  currency: string;
}

export interface RoadmapActionSummary {
  title: string;
  category: string;
  priority: number;
  estimatedGain: number;
  effortLevel: string;
  status: string;
  dueDate: string | null;
}

// ---------------------------------------------------------------------------
// Chart data for report visualizations
// ---------------------------------------------------------------------------

export interface WasteRadarChartData {
  category: WasteCategory;
  label: string;
  score: number;
}

export interface GainTimelineChartData {
  month: string; // "2025-01", etc.
  cumulativeGain: number;
  projectedGain: number;
}
