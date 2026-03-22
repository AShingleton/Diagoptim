// ---------------------------------------------------------------------------
// DiagOptim Brochure / Company Document Extractor
// ---------------------------------------------------------------------------

import { chat } from "@/lib/ai/engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A product or service offering found in the brochure. */
export interface BrochureOffering {
  /** Name of the product or service */
  name: string;
  /** Description of the offering */
  description: string;
  /** Price or price range if mentioned */
  price: string | null;
}

/** Contact information extracted from the brochure. */
export interface BrochureContactInfo {
  /** Company website */
  website: string | null;
  /** Contact email */
  email: string | null;
  /** Contact phone */
  phone: string | null;
  /** Physical address */
  address: string | null;
}

/** Structured data extracted from a company brochure or marketing document. */
export interface ExtractedBrochureData {
  /** Company name as presented in the brochure */
  companyName: string;
  /** Products or services offered */
  offerings: BrochureOffering[];
  /** Target market segments identified */
  targetSegments: string[];
  /** Key selling arguments or value propositions */
  keyArguments: string[];
  /** Overall positioning statement if identifiable */
  positioningStatement: string | null;
  /** Contact information found in the document */
  contactInfo: BrochureContactInfo;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const BROCHURE_EXTRACTION_PROMPT = `Tu es un expert en marketing et stratégie commerciale.
Analyse la brochure ou le document commercial fourni et extrais les données structurées.

IMPORTANT:
- Identifie tous les produits/services proposés.
- Détecte les segments de clientèle ciblés.
- Extrais les arguments de vente clés et la proposition de valeur.
- Identifie le positionnement de l'entreprise si possible.
- Si une donnée est absente, utilise null ou un tableau vide [].

Réponds UNIQUEMENT avec un objet JSON valide au format suivant:
{
  "companyName": "string",
  "offerings": [
    {
      "name": "string",
      "description": "string",
      "price": "string | null"
    }
  ],
  "targetSegments": ["string"],
  "keyArguments": ["string"],
  "positioningStatement": "string | null",
  "contactInfo": {
    "website": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "address": "string | null"
  }
}`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extracts structured brochure data from raw text using Claude AI.
 *
 * @param text - The anonymized brochure text (from OCR or PDF parsing)
 * @returns Structured brochure data with offerings, segments, and positioning
 * @throws Error if the AI response cannot be parsed
 */
export async function extractBrochureData(text: string): Promise<ExtractedBrochureData> {
  const response = await chat(
    BROCHURE_EXTRACTION_PROMPT,
    [{ role: "user", content: text }],
    { temperature: 0.2, maxTokens: 4096 }
  );

  return parseBrochureResponse(response);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parses and validates the AI response into an ExtractedBrochureData object.
 */
function parseBrochureResponse(raw: string): ExtractedBrochureData {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: Record<string, unknown> = JSON.parse(cleaned);

  // Validate required field
  if (!parsed["companyName"]) {
    throw new Error("Missing required brochure field: companyName");
  }

  // Parse offerings
  const rawOfferings = Array.isArray(parsed["offerings"]) ? parsed["offerings"] : [];
  const offerings: BrochureOffering[] = rawOfferings.map(
    (item: Record<string, unknown>) => ({
      name: String(item["name"] ?? ""),
      description: String(item["description"] ?? ""),
      price: item["price"] ? String(item["price"]) : null,
    })
  );

  // Parse string arrays
  const targetSegments = parseStringArray(parsed["targetSegments"]);
  const keyArguments = parseStringArray(parsed["keyArguments"]);

  // Parse contact info
  const contactRaw = (parsed["contactInfo"] as Record<string, unknown>) ?? {};
  const contactInfo: BrochureContactInfo = {
    website: contactRaw["website"] ? String(contactRaw["website"]) : null,
    email: contactRaw["email"] ? String(contactRaw["email"]) : null,
    phone: contactRaw["phone"] ? String(contactRaw["phone"]) : null,
    address: contactRaw["address"] ? String(contactRaw["address"]) : null,
  };

  return {
    companyName: String(parsed["companyName"]),
    offerings,
    targetSegments,
    keyArguments,
    positioningStatement: parsed["positioningStatement"]
      ? String(parsed["positioningStatement"])
      : null,
    contactInfo,
  };
}

/**
 * Safely parses an unknown value into a string array.
 */
function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" || typeof item === "number")
    .map(String);
}
