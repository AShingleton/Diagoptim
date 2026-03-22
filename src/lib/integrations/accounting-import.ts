/**
 * Accounting data import from CSV files.
 *
 * Supports Sage, Pennylane, QuickBooks, and generic CSV formats.
 * Parses and maps columns to DiagOptim's FinancialData model.
 *
 * @module integrations/accounting-import
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AccountingFormat = "sage" | "pennylane" | "quickbooks" | "generic";

export interface FinancialData {
  revenue: number;
  totalExpenses: number;
  purchaseCosts: number;
  personnelCosts: number;
  externalCosts: number;
  operatingResult: number;
  netResult: number;
  inventory: number;
  receivables: number;
  payables: number;
  currency: string;
  period: { start: string; end: string };
  lineItems: FinancialLineItem[];
}

export interface FinancialLineItem {
  account: string;
  label: string;
  debit: number;
  credit: number;
  balance: number;
  category: string;
}

interface ColumnMapping {
  account: number;
  label: number;
  debit: number;
  credit: number;
  date?: number;
}

// ---------------------------------------------------------------------------
// Format-specific column mappings
// ---------------------------------------------------------------------------

const COLUMN_MAPPINGS: Record<AccountingFormat, ColumnMapping> = {
  sage: { account: 0, label: 1, debit: 3, credit: 4, date: 2 },
  pennylane: { account: 0, label: 2, debit: 4, credit: 5, date: 1 },
  quickbooks: { account: 1, label: 2, debit: 3, credit: 4, date: 0 },
  generic: { account: 0, label: 1, debit: 2, credit: 3 },
};

// Account categories by account number prefix (Plan Comptable Général)
const ACCOUNT_CATEGORIES: Record<string, string> = {
  "60": "purchases",
  "61": "external_services",
  "62": "external_services",
  "63": "taxes",
  "64": "personnel",
  "65": "other_expenses",
  "66": "financial_expenses",
  "67": "exceptional_expenses",
  "68": "depreciation",
  "70": "revenue",
  "71": "inventory_variation",
  "72": "capitalized_production",
  "74": "operating_subsidies",
  "75": "other_revenue",
  "76": "financial_revenue",
  "77": "exceptional_revenue",
};

export interface AccountingEntry {
  date: string;
  account: string;
  label: string;
  debit: number;
  credit: number;
  category: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  grossMargin: number;
  grossMarginPercent: number;
  personnelRatio: number;
  externalCostsRatio: number;
  operatingResult: number;
  operatingMarginPercent: number;
  topExpenseCategories: Array<{ category: string; amount: number; percent: number }>;
  monthlyTrend: Array<{ month: string; revenue: number; expenses: number }>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Imports financial data from a CSV buffer.
 *
 * @param file   - The CSV file contents as a Buffer.
 * @param format - The accounting software format.
 * @returns Structured financial data.
 */
export async function importFromCSV(
  file: Buffer,
  format: AccountingFormat,
): Promise<FinancialData> {
  const content = file.toString("utf-8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV file is empty or has no data rows");
  }

  const mapping = COLUMN_MAPPINGS[format];
  const delimiter = detectDelimiter(lines[0]);

  // Skip header row
  const dataRows = lines.slice(1);
  const lineItems: FinancialLineItem[] = [];

  for (const row of dataRows) {
    const cols = parseCSVRow(row, delimiter);
    if (cols.length < Math.max(mapping.debit, mapping.credit) + 1) continue;

    const account = cols[mapping.account]?.trim() ?? "";
    const label = cols[mapping.label]?.trim() ?? "";
    const debit = parseAmount(cols[mapping.debit]);
    const credit = parseAmount(cols[mapping.credit]);

    if (!account) continue;

    const prefix = account.substring(0, 2);
    const category = ACCOUNT_CATEGORIES[prefix] ?? "other";

    lineItems.push({
      account,
      label,
      debit,
      credit,
      balance: debit - credit,
      category,
    });
  }

  return aggregateFinancialData(lineItems);
}

/**
 * Validates a CSV file structure for the given format.
 *
 * @returns An array of validation error messages (empty if valid).
 */
export function validateCSV(
  file: Buffer,
  format: AccountingFormat,
): string[] {
  const errors: string[] = [];
  const content = file.toString("utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    errors.push("Le fichier CSV est vide ou ne contient qu'un en-tête.");
    return errors;
  }

  const mapping = COLUMN_MAPPINGS[format];
  const delimiter = detectDelimiter(lines[0]);
  const headerCols = parseCSVRow(lines[0], delimiter);
  const requiredCols = Math.max(mapping.debit, mapping.credit) + 1;

  if (headerCols.length < requiredCols) {
    errors.push(
      `Le fichier nécessite au moins ${requiredCols} colonnes pour le format ${format}, trouvé ${headerCols.length}.`,
    );
  }

  // Check a sample of data rows
  const sampleRows = lines.slice(1, 6);
  let validRows = 0;
  for (const row of sampleRows) {
    const cols = parseCSVRow(row, delimiter);
    if (cols.length >= requiredCols) validRows++;
  }

  if (validRows === 0) {
    errors.push("Aucune ligne de données valide trouvée dans l'échantillon.");
  }

  return errors;
}

/**
 * Detects the accounting format from CSV header columns.
 *
 * @param headers - Array of header column names.
 * @returns The detected accounting format.
 */
export function detectFormat(headers: string[]): AccountingFormat {
  const joined = headers.map((h) => h.toLowerCase().trim()).join("|");

  // Sage: typically has "Compte", "Libellé", "Date", "Débit", "Crédit"
  if (joined.includes("compte") && joined.includes("journal")) return "sage";

  // Pennylane: has "account_number", "piece_ref", etc.
  if (joined.includes("account_number") || joined.includes("piece")) return "pennylane";

  // QuickBooks: has "Date", "Account", "Debit", "Credit" in English
  if (joined.includes("account") && joined.includes("memo")) return "quickbooks";

  return "generic";
}

/**
 * Parses CSV rows into structured accounting entries.
 *
 * @param rows      - Array of parsed CSV row arrays.
 * @param format    - The accounting format for column mapping.
 * @returns Parsed accounting entries.
 */
export function parseRows(rows: string[][], format: AccountingFormat): AccountingEntry[] {
  const mapping = COLUMN_MAPPINGS[format];
  const entries: AccountingEntry[] = [];

  for (const cols of rows) {
    if (cols.length < Math.max(mapping.debit, mapping.credit) + 1) continue;

    const account = cols[mapping.account]?.trim() ?? "";
    if (!account) continue;

    const prefix = account.substring(0, 2);
    const category = ACCOUNT_CATEGORIES[prefix] ?? "other";
    const date = mapping.date !== undefined ? (cols[mapping.date]?.trim() ?? "") : "";

    entries.push({
      date,
      account,
      label: cols[mapping.label]?.trim() ?? "",
      debit: parseAmount(cols[mapping.debit]),
      credit: parseAmount(cols[mapping.credit]),
      category,
    });
  }

  return entries;
}

/**
 * Generates a financial summary from accounting entries.
 *
 * @param entries - Array of parsed accounting entries.
 * @returns A structured financial summary with ratios and trends.
 */
export function summarizeFinancials(entries: AccountingEntry[]): FinancialSummary {
  let totalRevenue = 0;
  let totalExpenses = 0;
  let personnelCosts = 0;
  let externalCosts = 0;
  let purchaseCosts = 0;

  const categoryTotals: Record<string, number> = {};
  const monthlyData: Record<string, { revenue: number; expenses: number }> = {};

  for (const entry of entries) {
    const net = entry.debit - entry.credit;
    const prefix = entry.account.substring(0, 2);

    // Revenue (class 7)
    if (prefix >= "70" && prefix <= "79") {
      totalRevenue += entry.credit - entry.debit;
    }

    // Expenses (class 6)
    if (prefix >= "60" && prefix <= "69") {
      totalExpenses += net;

      const cat = entry.category;
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + net;

      if (cat === "personnel") personnelCosts += net;
      if (cat === "external_services") externalCosts += net;
      if (cat === "purchases") purchaseCosts += net;
    }

    // Monthly trend
    if (entry.date) {
      const month = entry.date.substring(0, 7); // YYYY-MM
      if (month.length >= 7) {
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0 };
        }
        if (prefix >= "70" && prefix <= "79") {
          monthlyData[month].revenue += entry.credit - entry.debit;
        }
        if (prefix >= "60" && prefix <= "69") {
          monthlyData[month].expenses += net;
        }
      }
    }
  }

  const grossMargin = totalRevenue - purchaseCosts;
  const operatingResult = totalRevenue - totalExpenses;

  const topExpenseCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percent: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const monthlyTrend = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    grossMargin: Math.round(grossMargin * 100) / 100,
    grossMarginPercent:
      totalRevenue > 0 ? Math.round((grossMargin / totalRevenue) * 10000) / 100 : 0,
    personnelRatio:
      totalRevenue > 0 ? Math.round((personnelCosts / totalRevenue) * 10000) / 100 : 0,
    externalCostsRatio:
      totalRevenue > 0 ? Math.round((externalCosts / totalRevenue) * 10000) / 100 : 0,
    operatingResult: Math.round(operatingResult * 100) / 100,
    operatingMarginPercent:
      totalRevenue > 0 ? Math.round((operatingResult / totalRevenue) * 10000) / 100 : 0,
    topExpenseCategories,
    monthlyTrend,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function detectDelimiter(headerLine: string): string {
  const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
  for (const char of headerLine) {
    if (char in counts) counts[char]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parseCSVRow(row: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseAmount(value: string | undefined): number {
  if (!value) return 0;
  // Handle French number format (1 234,56) and standard (1,234.56)
  const cleaned = value
    .trim()
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

function aggregateFinancialData(lineItems: FinancialLineItem[]): FinancialData {
  let revenue = 0;
  let purchaseCosts = 0;
  let personnelCosts = 0;
  let externalCosts = 0;
  let totalExpenses = 0;
  let inventory = 0;
  let receivables = 0;
  let payables = 0;

  for (const item of lineItems) {
    const prefix = item.account.substring(0, 2);

    switch (item.category) {
      case "revenue":
        revenue += item.credit - item.debit;
        break;
      case "purchases":
        purchaseCosts += item.debit - item.credit;
        totalExpenses += item.debit - item.credit;
        break;
      case "personnel":
        personnelCosts += item.debit - item.credit;
        totalExpenses += item.debit - item.credit;
        break;
      case "external_services":
        externalCosts += item.debit - item.credit;
        totalExpenses += item.debit - item.credit;
        break;
      case "inventory_variation":
        inventory += item.debit - item.credit;
        break;
      default:
        if (prefix >= "60" && prefix <= "68") {
          totalExpenses += item.debit - item.credit;
        }
        break;
    }

    // Balance sheet items (class 3, 4)
    if (prefix === "37" || prefix === "31" || prefix === "32") {
      inventory += item.debit - item.credit;
    }
    if (prefix === "41") {
      receivables += item.debit - item.credit;
    }
    if (prefix === "40") {
      payables += item.credit - item.debit;
    }
  }

  const operatingResult = revenue - totalExpenses;
  const netResult = operatingResult; // Simplified

  return {
    revenue: Math.round(revenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    purchaseCosts: Math.round(purchaseCosts * 100) / 100,
    personnelCosts: Math.round(personnelCosts * 100) / 100,
    externalCosts: Math.round(externalCosts * 100) / 100,
    operatingResult: Math.round(operatingResult * 100) / 100,
    netResult: Math.round(netResult * 100) / 100,
    inventory: Math.round(inventory * 100) / 100,
    receivables: Math.round(receivables * 100) / 100,
    payables: Math.round(payables * 100) / 100,
    currency: "EUR",
    period: { start: "", end: "" },
    lineItems,
  };
}
