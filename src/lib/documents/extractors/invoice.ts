// ---------------------------------------------------------------------------
// DiagOptim Invoice Extractor – structured data extraction from invoice text
// ---------------------------------------------------------------------------

import type {
  ExtractedInvoiceData,
  InvoiceLineItem,
} from "@/types/document";
import { chat } from "@/lib/ai/engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Cost category for expense classification. */
export type CostCategory =
  | "raw_materials"
  | "subcontracting"
  | "energy"
  | "transport"
  | "maintenance"
  | "insurance"
  | "rent"
  | "salary"
  | "marketing"
  | "it_telecom"
  | "professional_fees"
  | "taxes"
  | "other";

/** Extended invoice data with classification metadata. */
export interface ClassifiedInvoiceData extends ExtractedInvoiceData {
  /** Expense category for cost analysis */
  category: CostCategory;
  /** Whether this invoice is part of a recurring expense */
  isRecurring: boolean;
  /** Detected recurrence pattern (e.g., "monthly", "quarterly") */
  recurrencePattern: string | null;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const INVOICE_EXTRACTION_PROMPT = `Tu es un expert-comptable français spécialisé dans l'analyse de factures.
Extrais les données structurées de la facture fournie.

IMPORTANT:
- Tous les montants doivent être en nombres (pas de symboles monétaires).
- Les dates doivent être au format ISO (YYYY-MM-DD).
- Le taux de TVA est un pourcentage (ex: 20 pour 20%).
- Si une donnée est absente, utilise null.
- Détermine la catégorie de coût la plus appropriée.
- Détecte si la facture semble être récurrente (abonnement, mensualité, etc.).

Catégories de coût possibles:
raw_materials, subcontracting, energy, transport, maintenance, insurance,
rent, salary, marketing, it_telecom, professional_fees, taxes, other

Réponds UNIQUEMENT avec un objet JSON valide au format suivant:
{
  "invoiceNumber": "string",
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD | null",
  "supplierName": "string",
  "supplierSiret": "string | null",
  "clientName": "string",
  "clientSiret": "string | null",
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unitPriceHT": number,
      "totalHT": number,
      "vatRate": number
    }
  ],
  "totalHT": number,
  "totalVAT": number,
  "totalTTC": number,
  "currency": "EUR",
  "paymentTerms": "string | null",
  "department": "string | null",
  "category": "string",
  "isRecurring": boolean,
  "recurrencePattern": "string | null"
}`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extracts structured invoice data from raw text using Claude AI.
 *
 * @param text - The anonymized invoice text (from OCR or PDF parsing)
 * @returns Classified invoice data with expense categorization
 * @throws Error if the AI response cannot be parsed into valid invoice data
 */
export async function extractInvoiceData(text: string): Promise<ClassifiedInvoiceData> {
  const response = await chat(
    INVOICE_EXTRACTION_PROMPT,
    [{ role: "user", content: text }],
    { temperature: 0.1, maxTokens: 4096 }
  );

  const parsed = parseInvoiceResponse(response);
  return parsed;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parses and validates the AI response into a ClassifiedInvoiceData object.
 * Strips markdown fences and validates required fields.
 */
function parseInvoiceResponse(raw: string): ClassifiedInvoiceData {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: Record<string, unknown> = JSON.parse(cleaned);

  // Validate required fields
  const requiredFields = ["invoiceNumber", "supplierName", "totalHT", "totalTTC"];
  for (const field of requiredFields) {
    if (parsed[field] === undefined || parsed[field] === null) {
      throw new Error(`Missing required invoice field: ${field}`);
    }
  }

  // Parse and validate line items
  const rawLineItems = Array.isArray(parsed["lineItems"]) ? parsed["lineItems"] : [];
  const lineItems: InvoiceLineItem[] = rawLineItems.map((item: Record<string, unknown>) => ({
    description: String(item["description"] ?? ""),
    quantity: Number(item["quantity"] ?? 0),
    unitPriceHT: Number(item["unitPriceHT"] ?? 0),
    totalHT: Number(item["totalHT"] ?? 0),
    vatRate: Number(item["vatRate"] ?? 20),
  }));

  // Validate category
  const validCategories: ReadonlyArray<CostCategory> = [
    "raw_materials", "subcontracting", "energy", "transport", "maintenance",
    "insurance", "rent", "salary", "marketing", "it_telecom",
    "professional_fees", "taxes", "other",
  ];
  const category = validCategories.includes(parsed["category"] as CostCategory)
    ? (parsed["category"] as CostCategory)
    : "other";

  return {
    invoiceNumber: String(parsed["invoiceNumber"]),
    issueDate: String(parsed["issueDate"] ?? ""),
    dueDate: parsed["dueDate"] ? String(parsed["dueDate"]) : null,
    supplierName: String(parsed["supplierName"]),
    supplierSiret: parsed["supplierSiret"] ? String(parsed["supplierSiret"]) : null,
    clientName: String(parsed["clientName"] ?? ""),
    clientSiret: parsed["clientSiret"] ? String(parsed["clientSiret"]) : null,
    lineItems,
    totalHT: Number(parsed["totalHT"]),
    totalVAT: Number(parsed["totalVAT"] ?? 0),
    totalTTC: Number(parsed["totalTTC"]),
    currency: String(parsed["currency"] ?? "EUR"),
    paymentTerms: parsed["paymentTerms"] ? String(parsed["paymentTerms"]) : null,
    department: parsed["department"] ? String(parsed["department"]) : null,
    category,
    isRecurring: Boolean(parsed["isRecurring"]),
    recurrencePattern: parsed["recurrencePattern"] ? String(parsed["recurrencePattern"]) : null,
  };
}
