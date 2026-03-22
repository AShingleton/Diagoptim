// ---------------------------------------------------------------------------
// DiagOptim OCR Processing – image-to-text extraction via tesseract.js
// ---------------------------------------------------------------------------

import type { Worker, RecognizeResult } from "tesseract.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of an OCR operation with metadata. */
export interface OcrResult {
  /** Extracted text content */
  text: string;
  /** Confidence score (0-100) from Tesseract */
  confidence: number;
  /** Language used for recognition */
  language: string;
  /** Time taken for OCR in milliseconds */
  processingTimeMs: number;
}

/** Minimum confidence threshold below which a warning is emitted. */
const LOW_CONFIDENCE_THRESHOLD = 60;

/** Default OCR language (French). */
const DEFAULT_LANGUAGE = "fra";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Performs OCR on an image buffer and returns the extracted text with metadata.
 *
 * @param imageBuffer - Raw image buffer (PNG, JPEG, or WebP)
 * @param language - Tesseract language code (defaults to 'fra' for French)
 * @returns OcrResult with extracted text and confidence
 * @throws Error if Tesseract fails to initialize or process the image
 */
export async function performOcr(
  imageBuffer: Buffer,
  language: string = DEFAULT_LANGUAGE
): Promise<OcrResult> {
  const startTime = Date.now();

  // Pre-process the image for better OCR accuracy
  const processedBuffer = await preprocessImage(imageBuffer);

  // Create and configure the Tesseract worker
  const { createWorker } = await import("tesseract.js");
  const worker: Worker = await createWorker(language);

  try {
    const result: RecognizeResult = await worker.recognize(processedBuffer);
    const processingTimeMs = Date.now() - startTime;

    const ocrResult: OcrResult = {
      text: result.data.text,
      confidence: result.data.confidence,
      language,
      processingTimeMs,
    };

    if (ocrResult.confidence < LOW_CONFIDENCE_THRESHOLD) {
      console.warn(
        `[OCR] Low confidence (${ocrResult.confidence}%) for image. ` +
          "Consider using a higher-quality scan."
      );
    }

    return ocrResult;
  } finally {
    await worker.terminate();
  }
}

/**
 * Pre-processes an image buffer to improve OCR accuracy.
 * Applies grayscale conversion, contrast normalization, and resizing
 * for documents that are too small or low-contrast.
 *
 * @param buffer - The raw image buffer
 * @returns A processed image buffer optimized for OCR
 */
export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;

  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  let pipeline = sharp(buffer)
    // Convert to grayscale for cleaner text recognition
    .grayscale()
    // Normalize contrast to handle faded or overexposed scans
    .normalize();

  // Up-scale small images (below 1500px width) for better character recognition
  if (width > 0 && width < 1500) {
    const scaleFactor = Math.ceil(1500 / width);
    pipeline = pipeline.resize({
      width: width * scaleFactor,
      height: height * scaleFactor,
      fit: "fill",
      kernel: "lanczos3",
    });
  }

  // Apply slight sharpening to improve edge definition
  pipeline = pipeline.sharpen({
    sigma: 1.5,
  });

  // Output as PNG (lossless) to avoid JPEG artifacts
  return pipeline.png().toBuffer();
}

/**
 * Convenience function that extracts text from an image buffer.
 * Handles the full pipeline: preprocess, OCR, and return text.
 *
 * @param buffer - The raw image buffer
 * @param language - Tesseract language code (defaults to 'fra')
 * @returns The extracted text string
 */
export async function extractTextFromImage(
  buffer: Buffer,
  language?: string
): Promise<string> {
  const result = await performOcr(buffer, language);
  return result.text;
}

/**
 * Returns the confidence score from an OCR result.
 * Useful for filtering or flagging low-quality extractions.
 *
 * @param result - The OcrResult to evaluate
 * @returns Confidence score between 0 and 100
 */
export function getConfidence(result: OcrResult): number {
  return result.confidence;
}
