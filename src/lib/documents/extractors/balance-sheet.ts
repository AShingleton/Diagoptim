// ---------------------------------------------------------------------------
// DiagOptim Balance Sheet / Liasse Fiscale Extractor
// ---------------------------------------------------------------------------

import type {
  ExtractedBalanceSheet,
  BalanceSheetCategory,
} from "@/types/document";
import { chat } from "@/lib/ai/engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Financial ratios computed from balance sheet data. */
export interface FinancialRatios {
  /** Profitability ratio (résultat net / CA) */
  rentabilite: number | null;
  /** Liquidity ratio (actif circulant / dettes court terme) */
  liquidite: number | null;
  /** Debt ratio (dettes / capitaux propres) */
  endettement: number | null;
  /** Working capital requirement (BFR) in EUR */
  bfr: number | null;
}

/** Extended balance sheet data with computed ratios. */
export interface AnalyzedBalanceSheet {
  /** Raw extracted balance sheet data */
  balanceSheet: ExtractedBalanceSheet;
  /** Revenue (chiffre d'affaires) if found in liasse fiscale */
  chiffreAffaires: number | null;
  /** Operating expenses */
  chargesExploitation: number | null;
  /** Net income */
  resultatNet: number | null;
  /** Cash position */
  tresorerie: number | null;
  /** Equity total */
  capitauxPropres: number | null;
  /** Total debts */
  dettes: number | null;
  /** Computed financial ratios */
  ratios: FinancialRatios;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const BALANCE_SHEET_EXTRACTION_PROMPT = `Tu es un expert-comptable français spécialisé dans l'analyse de bilans et liasses fiscales.
Extrais les données structurées du bilan ou de la liasse fiscale fourni(e).

IMPORTANT:
- Tous les montants doivent être en nombres (en euros, sans symboles).
- Les dates doivent être au format ISO (YYYY-MM-DD).
- Regroupe les postes par catégories standard (actif immobilisé, actif circulant, capitaux propres, provisions, dettes).
- Si des sous-catégories sont identifiables, inclus-les.
- Extrais aussi le chiffre d'affaires, les charges, et le résultat net si présents (liasse fiscale).
- Si une donnée est absente, utilise null.

Réponds UNIQUEMENT avec un objet JSON valide au format suivant:
{
  "fiscalYear": "2024",
  "closingDate": "YYYY-MM-DD",
  "assets": {
    "fixedAssets": [{ "label": "string", "amount": number, "subcategories": [] }],
    "currentAssets": [{ "label": "string", "amount": number, "subcategories": [] }],
    "totalAssets": number
  },
  "liabilities": {
    "equity": [{ "label": "string", "amount": number }],
    "provisions": [{ "label": "string", "amount": number }],
    "debts": [{ "label": "string", "amount": number }],
    "totalLiabilities": number
  },
  "currency": "EUR",
  "chiffreAffaires": number | null,
  "chargesExploitation": number | null,
  "resultatNet": number | null,
  "tresorerie": number | null,
  "capitauxPropres": number | null,
  "dettes": number | null
}`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extracts structured balance sheet data from raw text using Claude AI.
 * Computes key financial ratios from the extracted figures.
 *
 * @param text - The anonymized balance sheet or liasse fiscale text
 * @returns Analyzed balance sheet with computed financial ratios
 * @throws Error if the AI response cannot be parsed
 */
export async function extractBalanceSheetData(text: string): Promise<AnalyzedBalanceSheet> {
  const response = await chat(
    BALANCE_SHEET_EXTRACTION_PROMPT,
    [{ role: "user", content: text }],
    { temperature: 0.1, maxTokens: 8192 }
  );

  return parseBalanceSheetResponse(response);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parses the AI response and computes financial ratios.
 */
function parseBalanceSheetResponse(raw: string): AnalyzedBalanceSheet {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: Record<string, unknown> = JSON.parse(cleaned);

  // Parse assets
  const assetsRaw = parsed["assets"] as Record<string, unknown> | undefined;
  const fixedAssets = parseCategories(assetsRaw?.["fixedAssets"]);
  const currentAssets = parseCategories(assetsRaw?.["currentAssets"]);
  const totalAssets = Number(assetsRaw?.["totalAssets"] ?? 0);

  // Parse liabilities
  const liabilitiesRaw = parsed["liabilities"] as Record<string, unknown> | undefined;
  const equity = parseCategories(liabilitiesRaw?.["equity"]);
  const provisions = parseCategories(liabilitiesRaw?.["provisions"]);
  const debts = parseCategories(liabilitiesRaw?.["debts"]);
  const totalLiabilities = Number(liabilitiesRaw?.["totalLiabilities"] ?? 0);

  // Extract additional financial figures
  const chiffreAffaires = parseNullableNumber(parsed["chiffreAffaires"]);
  const chargesExploitation = parseNullableNumber(parsed["chargesExploitation"]);
  const resultatNet = parseNullableNumber(parsed["resultatNet"]);
  const tresorerie = parseNullableNumber(parsed["tresorerie"]);
  const capitauxPropres = parseNullableNumber(parsed["capitauxPropres"]);
  const dettesTotal = parseNullableNumber(parsed["dettes"]);

  const balanceSheet: ExtractedBalanceSheet = {
    fiscalYear: String(parsed["fiscalYear"] ?? ""),
    closingDate: String(parsed["closingDate"] ?? ""),
    assets: { fixedAssets, currentAssets, totalAssets },
    liabilities: { equity, provisions, debts, totalLiabilities },
    currency: String(parsed["currency"] ?? "EUR"),
  };

  // Compute ratios
  const ratios = computeRatios({
    chiffreAffaires,
    resultatNet,
    capitauxPropres,
    dettes: dettesTotal,
    currentAssetsTotal: sumCategories(currentAssets),
    shortTermDebts: sumCategories(debts),
  });

  return {
    balanceSheet,
    chiffreAffaires,
    chargesExploitation,
    resultatNet,
    tresorerie,
    capitauxPropres,
    dettes: dettesTotal,
    ratios,
  };
}

/**
 * Parses a raw array of category objects into BalanceSheetCategory[].
 */
function parseCategories(raw: unknown): BalanceSheetCategory[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item: Record<string, unknown>) => {
    const result: BalanceSheetCategory = {
      label: String(item["label"] ?? ""),
      amount: Number(item["amount"] ?? 0),
    };

    if (Array.isArray(item["subcategories"]) && (item["subcategories"] as unknown[]).length > 0) {
      result.subcategories = parseCategories(item["subcategories"]);
    }

    return result;
  });
}

/**
 * Sums the amounts of a list of balance sheet categories.
 */
function sumCategories(categories: BalanceSheetCategory[]): number {
  return categories.reduce((sum, cat) => sum + cat.amount, 0);
}

/**
 * Safely parses a value to a number or null.
 */
function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Computes financial ratios from extracted balance sheet figures.
 */
function computeRatios(data: {
  chiffreAffaires: number | null;
  resultatNet: number | null;
  capitauxPropres: number | null;
  dettes: number | null;
  currentAssetsTotal: number;
  shortTermDebts: number;
}): FinancialRatios {
  const { chiffreAffaires, resultatNet, capitauxPropres, dettes, currentAssetsTotal, shortTermDebts } = data;

  // Profitability: résultat net / chiffre d'affaires
  const rentabilite =
    chiffreAffaires !== null && chiffreAffaires !== 0 && resultatNet !== null
      ? Math.round((resultatNet / chiffreAffaires) * 10000) / 10000
      : null;

  // Liquidity: actif circulant / dettes court terme
  const liquidite =
    shortTermDebts > 0
      ? Math.round((currentAssetsTotal / shortTermDebts) * 100) / 100
      : null;

  // Debt ratio: dettes / capitaux propres
  const endettement =
    capitauxPropres !== null && capitauxPropres !== 0 && dettes !== null
      ? Math.round((dettes / capitauxPropres) * 100) / 100
      : null;

  // BFR: actif circulant - dettes court terme (simplified)
  const bfr =
    currentAssetsTotal > 0 && shortTermDebts > 0
      ? Math.round(currentAssetsTotal - shortTermDebts)
      : null;

  return { rentabilite, liquidite, endettement, bfr };
}
