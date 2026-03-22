// ---------------------------------------------------------------------------
// DiagOptim Extracted Data Validator
// ---------------------------------------------------------------------------

import type {
  DocumentType,
  ExtractedData,
  ExtractedInvoiceData,
  ExtractedQuoteData,
  ExtractedBalanceSheet,
} from "@/types/document";
import type { CompanyProfile } from "@/types/company";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Severity levels for validation issues. */
export type ValidationSeverity = "error" | "warning" | "info";

/** A single validation issue found in the extracted data. */
export interface ValidationIssue {
  /** The field or area where the issue was found */
  field: string;
  /** Human-readable description of the issue */
  message: string;
  /** Severity: error = blocks integration, warning = needs review, info = FYI */
  severity: ValidationSeverity;
  /** The actual value found */
  actualValue: string | number | null;
  /** The expected value or constraint */
  expectedConstraint: string;
}

/** Result of a full validation pass. */
export interface ValidationResult {
  /** Whether the data passes all error-level checks */
  isValid: boolean;
  /** All issues found during validation */
  issues: ValidationIssue[];
  /** Count by severity */
  errorCount: number;
  /** Count by severity */
  warningCount: number;
  /** Count by severity */
  infoCount: number;
}

/** Result of a single consistency check. */
export interface ConsistencyCheck {
  /** Name of the check */
  checkName: string;
  /** Whether the check passed */
  passed: boolean;
  /** Detail message */
  message: string;
  /** The computed difference or discrepancy if any */
  discrepancy: number | null;
}

/** An anomaly detected by comparing data against company profile. */
export interface Anomaly {
  /** Type of anomaly detected */
  type: "amount_outlier" | "date_anomaly" | "category_mismatch" | "missing_critical" | "suspicious_value";
  /** Human-readable description */
  message: string;
  /** Severity of the anomaly */
  severity: ValidationSeverity;
  /** The field where the anomaly was detected */
  field: string;
  /** The value that triggered the anomaly */
  value: string | number | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Tolerance for floating-point comparison of monetary amounts (in EUR). */
const AMOUNT_TOLERANCE = 0.02;

/** Maximum reasonable invoice/quote amount ratio vs. annual revenue. */
const MAX_INVOICE_REVENUE_RATIO = 0.5;

/** Maximum reasonable number of days for payment terms. */
const MAX_PAYMENT_DAYS = 365;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates extracted data for correctness and completeness.
 *
 * @param data - The extracted data to validate
 * @param type - The document type for type-specific validation
 * @returns A ValidationResult with all found issues
 */
export function validateExtractedData(
  data: ExtractedData,
  type: DocumentType
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Run generic checks
  issues.push(...checkRequiredFields(data));

  // Run type-specific validation
  switch (type) {
    case "invoice":
      if (data.type === "invoice") {
        issues.push(...validateInvoice(data.data));
      }
      break;
    case "quote":
      if (data.type === "quote") {
        issues.push(...validateQuote(data.data));
      }
      break;
    case "balance_sheet":
      if (data.type === "balance_sheet") {
        issues.push(...validateBalanceSheet(data.data));
      }
      break;
    default:
      // No specific validation for other types yet
      break;
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return {
    isValid: errorCount === 0,
    issues,
    errorCount,
    warningCount,
    infoCount,
  };
}

/**
 * Runs consistency checks on extracted data (e.g., HT + TVA = TTC).
 *
 * @param data - The extracted data to check
 * @returns An array of consistency check results
 */
export function checkConsistency(data: ExtractedData): ConsistencyCheck[] {
  const checks: ConsistencyCheck[] = [];

  if (data.type === "invoice") {
    checks.push(...checkInvoiceConsistency(data.data));
  }

  if (data.type === "quote") {
    checks.push(...checkQuoteConsistency(data.data));
  }

  if (data.type === "balance_sheet") {
    checks.push(...checkBalanceSheetConsistency(data.data));
  }

  return checks;
}

/**
 * Flags anomalies by comparing extracted data against the company profile.
 *
 * @param data - The extracted data to analyze
 * @param companyProfile - Optional company profile for contextual checks
 * @returns An array of detected anomalies
 */
export function flagAnomalies(
  data: ExtractedData,
  companyProfile?: CompanyProfile
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  if (data.type === "invoice") {
    anomalies.push(...flagInvoiceAnomalies(data.data, companyProfile));
  }

  if (data.type === "quote") {
    anomalies.push(...flagQuoteAnomalies(data.data, companyProfile));
  }

  if (data.type === "balance_sheet") {
    anomalies.push(...flagBalanceSheetAnomalies(data.data));
  }

  return anomalies;
}

// ---------------------------------------------------------------------------
// Generic checks
// ---------------------------------------------------------------------------

/**
 * Verifies that the extracted data has a valid type field.
 */
function checkRequiredFields(data: ExtractedData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!data.type) {
    issues.push({
      field: "type",
      message: "Le type de document extrait est manquant.",
      severity: "error",
      actualValue: null,
      expectedConstraint: "Un type de document valide",
    });
  }

  if (!data.data) {
    issues.push({
      field: "data",
      message: "Les données extraites sont vides.",
      severity: "error",
      actualValue: null,
      expectedConstraint: "Données structurées non-nulles",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Invoice validation
// ---------------------------------------------------------------------------

/**
 * Validates invoice-specific fields.
 */
function validateInvoice(data: ExtractedInvoiceData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!data) {
    issues.push({ field: "data", message: "Données de facture manquantes.", severity: "error", actualValue: null, expectedConstraint: "non-null invoice data" });
    return issues;
  }

  // Required fields
  if (!data.invoiceNumber) {
    issues.push({
      field: "invoiceNumber",
      message: "Numéro de facture manquant.",
      severity: "error",
      actualValue: null,
      expectedConstraint: "Numéro de facture non vide",
    });
  }

  if (!data.supplierName) {
    issues.push({
      field: "supplierName",
      message: "Nom du fournisseur manquant.",
      severity: "error",
      actualValue: null,
      expectedConstraint: "Nom de fournisseur non vide",
    });
  }

  // Amount checks
  if (data.totalHT <= 0) {
    issues.push({
      field: "totalHT",
      message: "Le montant HT doit être positif.",
      severity: "error",
      actualValue: data.totalHT,
      expectedConstraint: "> 0",
    });
  }

  if (data.totalTTC <= 0) {
    issues.push({
      field: "totalTTC",
      message: "Le montant TTC doit être positif.",
      severity: "error",
      actualValue: data.totalTTC,
      expectedConstraint: "> 0",
    });
  }

  if (data.totalTTC < data.totalHT) {
    issues.push({
      field: "totalTTC",
      message: "Le montant TTC ne peut pas être inférieur au montant HT.",
      severity: "warning",
      actualValue: data.totalTTC,
      expectedConstraint: `>= ${data.totalHT} (totalHT)`,
    });
  }

  // Date validation
  if (data.issueDate && !isValidIsoDate(data.issueDate)) {
    issues.push({
      field: "issueDate",
      message: "La date d'émission n'est pas au format ISO valide.",
      severity: "error",
      actualValue: data.issueDate,
      expectedConstraint: "YYYY-MM-DD",
    });
  }

  if (data.dueDate && !isValidIsoDate(data.dueDate)) {
    issues.push({
      field: "dueDate",
      message: "La date d'échéance n'est pas au format ISO valide.",
      severity: "warning",
      actualValue: data.dueDate,
      expectedConstraint: "YYYY-MM-DD",
    });
  }

  // Line items validation
  if (data.lineItems.length === 0) {
    issues.push({
      field: "lineItems",
      message: "Aucune ligne de facturation détectée.",
      severity: "warning",
      actualValue: 0,
      expectedConstraint: ">= 1 ligne",
    });
  }

  for (let i = 0; i < data.lineItems.length; i++) {
    const item = data.lineItems[i];
    if (item.quantity <= 0) {
      issues.push({
        field: `lineItems[${i}].quantity`,
        message: `Ligne ${i + 1}: la quantité doit être positive.`,
        severity: "warning",
        actualValue: item.quantity,
        expectedConstraint: "> 0",
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Quote validation
// ---------------------------------------------------------------------------

/**
 * Validates quote-specific fields.
 */
function validateQuote(data: ExtractedQuoteData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!data.quoteNumber) {
    issues.push({
      field: "quoteNumber",
      message: "Numéro de devis manquant.",
      severity: "error",
      actualValue: null,
      expectedConstraint: "Numéro de devis non vide",
    });
  }

  if (data.totalHT <= 0) {
    issues.push({
      field: "totalHT",
      message: "Le montant HT du devis doit être positif.",
      severity: "error",
      actualValue: data.totalHT,
      expectedConstraint: "> 0",
    });
  }

  if (data.issueDate && data.validUntil) {
    const issueMs = new Date(data.issueDate).getTime();
    const validMs = new Date(data.validUntil).getTime();
    if (validMs < issueMs) {
      issues.push({
        field: "validUntil",
        message: "La date de validité est antérieure à la date d'émission.",
        severity: "error",
        actualValue: data.validUntil,
        expectedConstraint: `>= ${data.issueDate}`,
      });
    }
  }

  if (data.lineItems.length === 0) {
    issues.push({
      field: "lineItems",
      message: "Aucune ligne de devis détectée.",
      severity: "warning",
      actualValue: 0,
      expectedConstraint: ">= 1 ligne",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Balance sheet validation
// ---------------------------------------------------------------------------

/**
 * Validates balance sheet-specific fields.
 */
function validateBalanceSheet(data: ExtractedBalanceSheet): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!data.fiscalYear) {
    issues.push({
      field: "fiscalYear",
      message: "Année fiscale manquante.",
      severity: "error",
      actualValue: null,
      expectedConstraint: "Année fiscale non vide",
    });
  }

  if (data.assets.totalAssets <= 0) {
    issues.push({
      field: "assets.totalAssets",
      message: "Le total de l'actif doit être positif.",
      severity: "error",
      actualValue: data.assets.totalAssets,
      expectedConstraint: "> 0",
    });
  }

  if (data.liabilities.totalLiabilities <= 0) {
    issues.push({
      field: "liabilities.totalLiabilities",
      message: "Le total du passif doit être positif.",
      severity: "error",
      actualValue: data.liabilities.totalLiabilities,
      expectedConstraint: "> 0",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Consistency checks
// ---------------------------------------------------------------------------

/**
 * Checks invoice amount consistency (HT + TVA = TTC, line items sum).
 */
function checkInvoiceConsistency(data: ExtractedInvoiceData): ConsistencyCheck[] {
  const checks: ConsistencyCheck[] = [];

  // HT + TVA should equal TTC
  const computedTTC = data.totalHT + data.totalVAT;
  const ttcDiff = Math.abs(computedTTC - data.totalTTC);
  checks.push({
    checkName: "invoice_ht_tva_ttc",
    passed: ttcDiff <= AMOUNT_TOLERANCE,
    message: ttcDiff <= AMOUNT_TOLERANCE
      ? `HT (${data.totalHT}) + TVA (${data.totalVAT}) = TTC (${data.totalTTC}) ✓`
      : `HT (${data.totalHT}) + TVA (${data.totalVAT}) = ${computedTTC}, mais TTC = ${data.totalTTC} (écart: ${ttcDiff.toFixed(2)}€)`,
    discrepancy: ttcDiff <= AMOUNT_TOLERANCE ? null : ttcDiff,
  });

  // Sum of line items HT should equal totalHT
  if (data.lineItems.length > 0) {
    const lineItemsSum = data.lineItems.reduce((sum, item) => sum + item.totalHT, 0);
    const linesDiff = Math.abs(lineItemsSum - data.totalHT);
    checks.push({
      checkName: "invoice_line_items_sum",
      passed: linesDiff <= AMOUNT_TOLERANCE,
      message: linesDiff <= AMOUNT_TOLERANCE
        ? `Somme des lignes HT (${lineItemsSum}) = Total HT (${data.totalHT}) ✓`
        : `Somme des lignes HT (${lineItemsSum.toFixed(2)}) ≠ Total HT (${data.totalHT}) (écart: ${linesDiff.toFixed(2)}€)`,
      discrepancy: linesDiff <= AMOUNT_TOLERANCE ? null : linesDiff,
    });
  }

  // Due date should be after issue date
  if (data.issueDate && data.dueDate) {
    const issueMs = new Date(data.issueDate).getTime();
    const dueMs = new Date(data.dueDate).getTime();
    const passed = dueMs >= issueMs;
    checks.push({
      checkName: "invoice_date_order",
      passed,
      message: passed
        ? `Date d'échéance (${data.dueDate}) >= Date d'émission (${data.issueDate}) ✓`
        : `Date d'échéance (${data.dueDate}) est avant la date d'émission (${data.issueDate})`,
      discrepancy: null,
    });
  }

  return checks;
}

/**
 * Checks quote amount consistency.
 */
function checkQuoteConsistency(data: ExtractedQuoteData): ConsistencyCheck[] {
  const checks: ConsistencyCheck[] = [];

  const computedTTC = data.totalHT + data.totalVAT;
  const ttcDiff = Math.abs(computedTTC - data.totalTTC);
  checks.push({
    checkName: "quote_ht_tva_ttc",
    passed: ttcDiff <= AMOUNT_TOLERANCE,
    message: ttcDiff <= AMOUNT_TOLERANCE
      ? `HT (${data.totalHT}) + TVA (${data.totalVAT}) = TTC (${data.totalTTC}) ✓`
      : `HT (${data.totalHT}) + TVA (${data.totalVAT}) = ${computedTTC}, mais TTC = ${data.totalTTC} (écart: ${ttcDiff.toFixed(2)}€)`,
    discrepancy: ttcDiff <= AMOUNT_TOLERANCE ? null : ttcDiff,
  });

  if (data.lineItems.length > 0) {
    const lineItemsSum = data.lineItems.reduce((sum, item) => sum + item.totalHT, 0);
    const linesDiff = Math.abs(lineItemsSum - data.totalHT);
    checks.push({
      checkName: "quote_line_items_sum",
      passed: linesDiff <= AMOUNT_TOLERANCE,
      message: linesDiff <= AMOUNT_TOLERANCE
        ? `Somme des lignes HT (${lineItemsSum}) = Total HT (${data.totalHT}) ✓`
        : `Somme des lignes HT (${lineItemsSum.toFixed(2)}) ≠ Total HT (${data.totalHT}) (écart: ${linesDiff.toFixed(2)}€)`,
      discrepancy: linesDiff <= AMOUNT_TOLERANCE ? null : linesDiff,
    });
  }

  return checks;
}

/**
 * Checks balance sheet consistency (actif = passif).
 */
function checkBalanceSheetConsistency(data: ExtractedBalanceSheet): ConsistencyCheck[] {
  const checks: ConsistencyCheck[] = [];

  const diff = Math.abs(data.assets.totalAssets - data.liabilities.totalLiabilities);
  checks.push({
    checkName: "balance_sheet_equilibrium",
    passed: diff <= AMOUNT_TOLERANCE,
    message: diff <= AMOUNT_TOLERANCE
      ? `Actif (${data.assets.totalAssets}) = Passif (${data.liabilities.totalLiabilities}) ✓`
      : `Actif (${data.assets.totalAssets}) ≠ Passif (${data.liabilities.totalLiabilities}) (écart: ${diff.toFixed(2)}€)`,
    discrepancy: diff <= AMOUNT_TOLERANCE ? null : diff,
  });

  return checks;
}

// ---------------------------------------------------------------------------
// Anomaly detection
// ---------------------------------------------------------------------------

/**
 * Detects anomalies in invoice data relative to company profile.
 */
function flagInvoiceAnomalies(
  data: ExtractedInvoiceData,
  companyProfile?: CompanyProfile
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Check for unreasonably high amounts vs. annual revenue
  if (companyProfile?.annualRevenue && data.totalTTC > companyProfile.annualRevenue * MAX_INVOICE_REVENUE_RATIO) {
    anomalies.push({
      type: "amount_outlier",
      message: `Le montant TTC (${data.totalTTC}€) représente plus de ${MAX_INVOICE_REVENUE_RATIO * 100}% du CA annuel (${companyProfile.annualRevenue}€).`,
      severity: "warning",
      field: "totalTTC",
      value: data.totalTTC,
    });
  }

  // Check for future issue dates
  if (data.issueDate) {
    const issueDate = new Date(data.issueDate);
    const today = new Date();
    if (issueDate.getTime() > today.getTime() + 86400000) {
      anomalies.push({
        type: "date_anomaly",
        message: `La date d'émission (${data.issueDate}) est dans le futur.`,
        severity: "warning",
        field: "issueDate",
        value: data.issueDate,
      });
    }
  }

  // Check for extremely long payment terms
  if (data.issueDate && data.dueDate) {
    const daysDiff = Math.floor(
      (new Date(data.dueDate).getTime() - new Date(data.issueDate).getTime()) / 86400000
    );
    if (daysDiff > MAX_PAYMENT_DAYS) {
      anomalies.push({
        type: "suspicious_value",
        message: `Le délai de paiement (${daysDiff} jours) semble anormalement long.`,
        severity: "warning",
        field: "dueDate",
        value: daysDiff,
      });
    }
  }

  // Check for zero VAT (might be legitimate but worth flagging)
  if (data.totalVAT === 0 && data.totalHT > 0) {
    anomalies.push({
      type: "suspicious_value",
      message: "La facture ne comporte aucune TVA. Vérifiez si c'est correct (auto-liquidation, franchise, etc.).",
      severity: "info",
      field: "totalVAT",
      value: 0,
    });
  }

  return anomalies;
}

/**
 * Detects anomalies in quote data relative to company profile.
 */
function flagQuoteAnomalies(
  data: ExtractedQuoteData,
  companyProfile?: CompanyProfile
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  if (companyProfile?.annualRevenue && data.totalTTC > companyProfile.annualRevenue * MAX_INVOICE_REVENUE_RATIO) {
    anomalies.push({
      type: "amount_outlier",
      message: `Le montant TTC du devis (${data.totalTTC}€) représente plus de ${MAX_INVOICE_REVENUE_RATIO * 100}% du CA annuel.`,
      severity: "warning",
      field: "totalTTC",
      value: data.totalTTC,
    });
  }

  if (data.validUntil) {
    const validDate = new Date(data.validUntil);
    const today = new Date();
    if (validDate.getTime() < today.getTime()) {
      anomalies.push({
        type: "date_anomaly",
        message: `Le devis a expiré le ${data.validUntil}.`,
        severity: "info",
        field: "validUntil",
        value: data.validUntil,
      });
    }
  }

  return anomalies;
}

/**
 * Detects anomalies in balance sheet data.
 */
function flagBalanceSheetAnomalies(data: ExtractedBalanceSheet): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Negative equity is a critical warning
  const equityTotal = data.liabilities.equity.reduce((sum, e) => sum + e.amount, 0);
  if (equityTotal < 0) {
    anomalies.push({
      type: "amount_outlier",
      message: `Les capitaux propres sont négatifs (${equityTotal}€). L'entreprise peut être en difficulté.`,
      severity: "warning",
      field: "liabilities.equity",
      value: equityTotal,
    });
  }

  // Very old fiscal year
  const year = parseInt(data.fiscalYear, 10);
  const currentYear = new Date().getFullYear();
  if (!isNaN(year) && currentYear - year > 3) {
    anomalies.push({
      type: "date_anomaly",
      message: `Le bilan date de ${data.fiscalYear}, soit plus de 3 ans. Les données peuvent être obsolètes.`,
      severity: "warning",
      field: "fiscalYear",
      value: data.fiscalYear,
    });
  }

  return anomalies;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Validates that a string is a valid ISO date (YYYY-MM-DD).
 */
function isValidIsoDate(dateStr: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}
