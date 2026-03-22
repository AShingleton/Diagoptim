// ---------------------------------------------------------------------------
// DiagOptim Insurance Document Extractor
// ---------------------------------------------------------------------------

import { chat } from "@/lib/ai/engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Type of insurance policy. */
export type InsurancePolicyType =
  | "responsabilite_civile"
  | "multirisque_pro"
  | "vehicule"
  | "homme_cle"
  | "perte_exploitation"
  | "cyber"
  | "decennale"
  | "protection_juridique"
  | "prevoyance"
  | "sante"
  | "other";

/** A single guarantee/coverage within an insurance policy. */
export interface InsuranceGuarantee {
  /** Name of the guarantee */
  name: string;
  /** Coverage amount in EUR */
  coverageAmount: number | null;
  /** Deductible (franchise) in EUR */
  deductible: number | null;
  /** Description of what is covered */
  description: string;
}

/** Structured data extracted from an insurance document. */
export interface ExtractedInsuranceData {
  /** Insurance company name */
  insurer: string;
  /** Policy/contract number */
  policyNumber: string;
  /** Type of insurance policy */
  type: InsurancePolicyType;
  /** List of guarantees/coverages */
  guarantees: InsuranceGuarantee[];
  /** Annual premium in EUR */
  premium: number;
  /** General deductible in EUR */
  deductible: number | null;
  /** Policy start date (ISO) */
  startDate: string;
  /** Policy end date (ISO) */
  endDate: string;
  /** Total coverage amount in EUR */
  coverageAmount: number | null;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const INSURANCE_EXTRACTION_PROMPT = `Tu es un expert en assurances professionnelles en France.
Extrais les données structurées du contrat ou attestation d'assurance fourni(e).

IMPORTANT:
- Tous les montants doivent être en nombres (en euros, sans symboles).
- Les dates doivent être au format ISO (YYYY-MM-DD).
- Identifie le type de police parmi: responsabilite_civile, multirisque_pro, vehicule,
  homme_cle, perte_exploitation, cyber, decennale, protection_juridique, prevoyance, sante, other.
- Liste toutes les garanties avec leurs plafonds et franchises.
- Si une donnée est absente, utilise null.

Réponds UNIQUEMENT avec un objet JSON valide au format suivant:
{
  "insurer": "string",
  "policyNumber": "string",
  "type": "string",
  "guarantees": [
    {
      "name": "string",
      "coverageAmount": number | null,
      "deductible": number | null,
      "description": "string"
    }
  ],
  "premium": number,
  "deductible": number | null,
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "coverageAmount": number | null
}`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extracts structured insurance data from raw text using Claude AI.
 *
 * @param text - The anonymized insurance document text
 * @returns Structured insurance data with guarantees and coverage details
 * @throws Error if the AI response cannot be parsed
 */
export async function extractInsuranceData(text: string): Promise<ExtractedInsuranceData> {
  const response = await chat(
    INSURANCE_EXTRACTION_PROMPT,
    [{ role: "user", content: text }],
    { temperature: 0.1, maxTokens: 4096 }
  );

  return parseInsuranceResponse(response);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parses and validates the AI response into an ExtractedInsuranceData object.
 */
function parseInsuranceResponse(raw: string): ExtractedInsuranceData {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed: Record<string, unknown> = JSON.parse(cleaned);

  // Validate required fields
  const requiredFields = ["insurer", "policyNumber", "premium", "startDate", "endDate"];
  for (const field of requiredFields) {
    if (parsed[field] === undefined || parsed[field] === null) {
      throw new Error(`Missing required insurance field: ${field}`);
    }
  }

  // Validate policy type
  const validTypes: ReadonlyArray<InsurancePolicyType> = [
    "responsabilite_civile", "multirisque_pro", "vehicule", "homme_cle",
    "perte_exploitation", "cyber", "decennale", "protection_juridique",
    "prevoyance", "sante", "other",
  ];
  const policyType = validTypes.includes(parsed["type"] as InsurancePolicyType)
    ? (parsed["type"] as InsurancePolicyType)
    : "other";

  // Parse guarantees
  const rawGuarantees = Array.isArray(parsed["guarantees"]) ? parsed["guarantees"] : [];
  const guarantees: InsuranceGuarantee[] = rawGuarantees.map(
    (item: Record<string, unknown>) => ({
      name: String(item["name"] ?? ""),
      coverageAmount: item["coverageAmount"] !== null && item["coverageAmount"] !== undefined
        ? Number(item["coverageAmount"])
        : null,
      deductible: item["deductible"] !== null && item["deductible"] !== undefined
        ? Number(item["deductible"])
        : null,
      description: String(item["description"] ?? ""),
    })
  );

  return {
    insurer: String(parsed["insurer"]),
    policyNumber: String(parsed["policyNumber"]),
    type: policyType,
    guarantees,
    premium: Number(parsed["premium"]),
    deductible: parsed["deductible"] !== null && parsed["deductible"] !== undefined
      ? Number(parsed["deductible"])
      : null,
    startDate: String(parsed["startDate"]),
    endDate: String(parsed["endDate"]),
    coverageAmount: parsed["coverageAmount"] !== null && parsed["coverageAmount"] !== undefined
      ? Number(parsed["coverageAmount"])
      : null,
  };
}
