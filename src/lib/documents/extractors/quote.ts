// ---------------------------------------------------------------------------
// DiagOptim Quote/Devis Extractor – structured data extraction from quotes
// ---------------------------------------------------------------------------

import type {
  ExtractedQuoteData,
  QuoteLineItem,
} from "@/types/document";
import { chat } from "@/lib/ai/engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Extended quote data with business intelligence fields. */
export interface ClassifiedQuoteData extends ExtractedQuoteData {
  /** Estimated implied margin percentage if detectable */
  impliedMargin: number | null;
  /** Whether a competitor is mentioned in the quote */
  competitorMention: string | null;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const QUOTE_EXTRACTION_PROMPT = `Tu es un expert commercial français spécialisé dans l'analyse de devis.
Extrais les données structurées du devis fourni.

IMPORTANT:
- Tous les montants doivent être en nombres (pas de symboles monétaires).
- Les dates doivent être au format ISO (YYYY-MM-DD).
- Le taux de TVA est un pourcentage (ex: 20 pour 20%).
- Si une donnée est absente, utilise null.
- Essaie de détecter la marge implicite si les coûts ou remises sont visibles.
- Note toute mention de concurrent dans le document.

Réponds UNIQUEMENT avec un objet JSON valide au format suivant:
{
  "quoteNumber": "string",
  "issueDate": "YYYY-MM-DD",
  "validUntil": "YYYY-MM-DD | null",
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
  "conditions": "string | null",
  "impliedMargin": number | null,
  "competitorMention": "string | null"
}`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extracts structured quote data from raw text using Claude AI.
 *
 * @param text - The anonymized quote text (from OCR or PDF parsing)
 * @returns Classified quote data with margin and competitor analysis
 * @throws Error if the AI response cannot be parsed into valid quote data
 */
export async function extractQuoteData(text: string): Promise<ClassifiedQuoteData> {
  const response = await chat(
    QUOTE_EXTRACTION_PROMPT,
    [{ role: "user", content: text }],
    { temperature: 0.1, maxTokens: 4096 }
  );

  return parseQuoteResponse(response);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parses and validates the AI response into a ClassifiedQuoteData object.
 */
function parseQuoteResponse(raw: string): ClassifiedQuoteData {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: Record<string, unknown> = JSON.parse(cleaned);

  // Validate required fields
  const requiredFields = ["quoteNumber", "supplierName", "totalHT", "totalTTC"];
  for (const field of requiredFields) {
    if (parsed[field] === undefined || parsed[field] === null) {
      throw new Error(`Missing required quote field: ${field}`);
    }
  }

  // Parse line items
  const rawLineItems = Array.isArray(parsed["lineItems"]) ? parsed["lineItems"] : [];
  const lineItems: QuoteLineItem[] = rawLineItems.map((item: Record<string, unknown>) => ({
    description: String(item["description"] ?? ""),
    quantity: Number(item["quantity"] ?? 0),
    unitPriceHT: Number(item["unitPriceHT"] ?? 0),
    totalHT: Number(item["totalHT"] ?? 0),
    vatRate: Number(item["vatRate"] ?? 20),
  }));

  return {
    quoteNumber: String(parsed["quoteNumber"]),
    issueDate: String(parsed["issueDate"] ?? ""),
    validUntil: parsed["validUntil"] ? String(parsed["validUntil"]) : null,
    supplierName: String(parsed["supplierName"]),
    supplierSiret: parsed["supplierSiret"] ? String(parsed["supplierSiret"]) : null,
    clientName: String(parsed["clientName"] ?? ""),
    clientSiret: parsed["clientSiret"] ? String(parsed["clientSiret"]) : null,
    lineItems,
    totalHT: Number(parsed["totalHT"]),
    totalVAT: Number(parsed["totalVAT"] ?? 0),
    totalTTC: Number(parsed["totalTTC"]),
    currency: String(parsed["currency"] ?? "EUR"),
    conditions: parsed["conditions"] ? String(parsed["conditions"]) : null,
    impliedMargin: parsed["impliedMargin"] !== null && parsed["impliedMargin"] !== undefined
      ? Number(parsed["impliedMargin"])
      : null,
    competitorMention: parsed["competitorMention"] ? String(parsed["competitorMention"]) : null,
  };
}
