// ---------------------------------------------------------------------------
// DiagOptim Document Processing Pipeline
// ---------------------------------------------------------------------------
//
// PIPELINE:
// 1. Upload to Supabase Storage (encrypted)
// 2. Detect type (PDF, image, DOCX)
// 3. Extract text (OCR if image, parsing if PDF/DOCX)
// 4. Anonymize personal data
// 5. Send to Claude for structured extraction based on document type
// 6. Return structured data for user validation
// 7. Integrate into diagnostic if validated
// ---------------------------------------------------------------------------

import type {
  DocumentType,
  DocumentMimeType,
  ExtractedData,
} from "@/types/document";
import { anonymize } from "@/lib/utils/anonymizer";
import { analyzeDocument } from "@/lib/ai/engine";
import { extractTextFromImage } from "./ocr";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported MIME types for document processing. */
type SupportedMimeType =
  | "application/pdf"
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Result of the full document processing pipeline. */
export interface ProcessedDocument {
  /** Detected document type */
  documentType: DocumentType;
  /** Raw text extracted from the file */
  rawText: string;
  /** Anonymized text sent to the AI */
  anonymizedText: string;
  /** Structured data returned by Claude */
  extractedData: ExtractedData;
  /** Extraction confidence score (0-1) */
  confidence: number;
  /** Mapping to restore anonymized values */
  anonymizationMapping: Map<string, string>;
}

/** Options for the document processing pipeline. */
export interface ProcessDocumentOptions {
  /** Override automatic type detection */
  forceType?: DocumentType;
  /** OCR language (defaults to 'fra') */
  ocrLanguage?: string;
}

// ---------------------------------------------------------------------------
// Filename-to-type keywords mapping
// ---------------------------------------------------------------------------

const TYPE_KEYWORDS: Record<string, DocumentType> = {
  facture: "invoice",
  invoice: "invoice",
  devis: "quote",
  quote: "quote",
  bilan: "balance_sheet",
  liasse: "balance_sheet",
  balance: "balance_sheet",
  compte: "income_statement",
  resultat: "income_statement",
  releve: "bank_statement",
  bank: "bank_statement",
  impot: "tax_return",
  fiscal: "tax_return",
  salaire: "payroll",
  paie: "payroll",
  contrat: "contract",
  contract: "contract",
};

// ---------------------------------------------------------------------------
// Content-based type keywords
// ---------------------------------------------------------------------------

const CONTENT_TYPE_PATTERNS: Array<{ pattern: RegExp; type: DocumentType }> = [
  { pattern: /facture\s+(n[°o]|num)/i, type: "invoice" },
  { pattern: /montant\s+ttc|total\s+ttc|net\s+[àa]\s+payer/i, type: "invoice" },
  { pattern: /devis\s+(n[°o]|num)/i, type: "quote" },
  { pattern: /validit[ée]\s+du\s+devis/i, type: "quote" },
  { pattern: /bilan\s+(actif|passif)|actif\s+immobilis/i, type: "balance_sheet" },
  { pattern: /liasse\s+fiscale/i, type: "balance_sheet" },
  { pattern: /compte\s+de\s+r[ée]sultat|charges?\s+d['']exploitation/i, type: "income_statement" },
  { pattern: /relev[ée]\s+(de\s+compte|bancaire)/i, type: "bank_statement" },
  { pattern: /d[ée]claration\s+fiscale|imp[ôo]t/i, type: "tax_return" },
  { pattern: /bulletin\s+de\s+(paie|salaire)/i, type: "payroll" },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Processes a document through the full extraction pipeline.
 *
 * @param file - The raw file buffer
 * @param filename - Original filename including extension
 * @param mimeType - MIME type of the uploaded file
 * @param _companyId - Company ID for storage scoping (used upstream for Supabase path)
 * @param options - Optional processing overrides
 * @returns A ProcessedDocument with extracted and validated data
 * @throws Error if the file type is unsupported or extraction fails
 */
export async function processDocument(
  file: Buffer,
  filename: string,
  mimeType: string,
  _companyId: string,
  options?: ProcessDocumentOptions
): Promise<ProcessedDocument> {
  // 1. Validate MIME type
  validateMimeType(mimeType);

  // 2. Extract raw text from the file
  const rawText = await extractText(file, mimeType as SupportedMimeType, options?.ocrLanguage);

  if (rawText.trim().length === 0) {
    throw new Error(
      `Could not extract any text from "${filename}". ` +
        "The file may be empty, corrupted, or contain only non-text content."
    );
  }

  // 3. Detect document type
  const documentType = options?.forceType ?? detectDocumentType(filename, rawText);

  // 4. Anonymize PII before sending to AI
  const { text: anonymizedText, mapping: anonymizationMapping } = anonymize(rawText);

  // 5. Send to Claude for structured extraction
  const extractedData = await classifyAndExtract(anonymizedText, documentType);

  // 6. Compute confidence based on extracted data completeness
  const confidence = computeConfidence(extractedData, rawText);

  return {
    documentType,
    rawText,
    anonymizedText,
    extractedData,
    confidence,
    anonymizationMapping,
  };
}

/**
 * Detects the document type from filename and content analysis.
 *
 * @param filename - The original filename
 * @param content - Extracted text content for content-based detection
 * @returns The detected DocumentType
 */
export function detectDocumentType(filename: string, content: string): DocumentType {
  // 1. Try filename-based detection first
  const normalizedFilename = filename.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const [keyword, type] of Object.entries(TYPE_KEYWORDS)) {
    if (normalizedFilename.includes(keyword)) {
      return type;
    }
  }

  // 2. Fall back to content-based detection
  for (const { pattern, type } of CONTENT_TYPE_PATTERNS) {
    if (pattern.test(content)) {
      return type;
    }
  }

  // 3. Default to "other" if no match
  return "other";
}

/**
 * Extracts raw text from a file buffer based on its MIME type.
 *
 * @param file - The raw file buffer
 * @param mimeType - The file's MIME type
 * @param ocrLanguage - Language hint for OCR (defaults to 'fra')
 * @returns The extracted text content
 */
export async function extractText(
  file: Buffer,
  mimeType: SupportedMimeType,
  ocrLanguage?: string
): Promise<string> {
  switch (mimeType) {
    case "application/pdf":
      return extractTextFromPdf(file);

    case "image/png":
    case "image/jpeg":
    case "image/webp":
      return extractTextFromImage(file, ocrLanguage);

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractTextFromDocx(file);

    default: {
      const _exhaustive: never = mimeType;
      throw new Error(`Unsupported MIME type: ${_exhaustive}`);
    }
  }
}

/**
 * Sends anonymized text to Claude for structured data extraction.
 *
 * @param text - The anonymized text to analyze
 * @param documentType - The detected document type
 * @returns Structured extracted data
 */
export async function classifyAndExtract(
  text: string,
  documentType: DocumentType
): Promise<ExtractedData> {
  return analyzeDocument(text, documentType);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extracts text from a PDF buffer using pdf-parse.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text;
}

/**
 * Extracts text from a DOCX buffer using mammoth.
 */
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Validates that the provided MIME type is supported.
 *
 * @throws Error if the MIME type is not in the supported list
 */
function validateMimeType(mimeType: string): asserts mimeType is SupportedMimeType {
  const supported: ReadonlyArray<string> = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!supported.includes(mimeType)) {
    throw new Error(
      `Unsupported file type: "${mimeType}". ` +
        `Supported types: ${supported.join(", ")}`
    );
  }
}

/**
 * Computes a confidence score (0-1) based on how much structured data
 * was successfully extracted relative to the raw text length.
 */
function computeConfidence(data: ExtractedData, rawText: string): number {
  const textLength = rawText.trim().length;

  // Base confidence from text length (very short = less reliable)
  const lengthScore = Math.min(textLength / 500, 1.0);

  // Check how many fields in the extracted data are populated
  const dataString = JSON.stringify(data.data);
  const nullCount = (dataString.match(/null/g) ?? []).length;
  const totalFields = Object.keys(data.data).length;
  const populatedRatio = totalFields > 0 ? Math.max(0, 1 - nullCount / totalFields) : 0;

  // Weighted average: 40% text length adequacy, 60% field population
  const score = lengthScore * 0.4 + populatedRatio * 0.6;

  // Clamp to [0, 1]
  return Math.round(Math.min(Math.max(score, 0), 1) * 100) / 100;
}
