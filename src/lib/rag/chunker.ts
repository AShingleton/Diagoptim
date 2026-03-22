/**
 * INTELLIGENT CHUNKING
 *
 * Splits text into chunks that respect document structure.
 *
 * Strategy (by priority):
 * 1. By sections (## or ### headings in Markdown, <h2>/<h3> in HTML)
 * 2. By paragraphs (double line breaks)
 * 3. By sentences (period + space + uppercase)
 * 4. By tokens (last resort, cuts at word boundary)
 *
 * Each chunk contains:
 * - Text content
 * - Metadata (section title, page, position)
 * - Context: partial overlap with previous chunk
 *
 * Optimal chunk size: 400-600 tokens for search
 * Overlap: 50-75 tokens for boundary context
 *
 * @module rag/chunker
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Chunk {
  content: string;
  tokenCount: number;
  index: number;
  metadata: {
    section?: string;
    pageNumber?: number;
    startLine?: number;
    heading?: string;
    documentPart?: string;
  };
}

export interface ChunkOptions {
  maxTokens?: number;
  overlapTokens?: number;
  respectHeadings?: boolean;
  language?: "fr" | "en";
}

// ---------------------------------------------------------------------------
// Token counting (fast approximation)
// ---------------------------------------------------------------------------

/**
 * Approximate token count for a string.
 * ~4 chars/token in French, ~3.5 in English.
 */
export function countTokens(text: string, language: "fr" | "en" = "fr"): number {
  const ratio = language === "fr" ? 3.8 : 3.5;
  return Math.ceil(text.length / ratio);
}

// ---------------------------------------------------------------------------
// Main chunker
// ---------------------------------------------------------------------------

const HEADING_REGEX = /^#{1,4}\s+.+$/gm;
const PARAGRAPH_BREAK = /\n\s*\n/;
const SENTENCE_BREAK = /(?<=[.!?])\s+(?=[A-ZÀ-ÖÙ-Ü])/;

export function chunkDocument(text: string, options: ChunkOptions = {}): Chunk[] {
  const {
    maxTokens = 500,
    overlapTokens = 50,
    respectHeadings = true,
    language = "fr",
  } = options;

  if (!text.trim()) return [];

  // Step 1: Split by headings if present
  let sections: { heading: string | undefined; content: string }[];
  if (respectHeadings && HEADING_REGEX.test(text)) {
    sections = splitByHeadings(text);
  } else {
    sections = [{ heading: undefined, content: text }];
  }

  const chunks: Chunk[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    const sectionChunks = chunkSection(
      section.content,
      section.heading,
      maxTokens,
      overlapTokens,
      language,
    );

    for (const sc of sectionChunks) {
      chunks.push({
        ...sc,
        index: globalIndex++,
      });
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function splitByHeadings(text: string): { heading: string | undefined; content: string }[] {
  const lines = text.split("\n");
  const sections: { heading: string | undefined; content: string }[] = [];
  let currentHeading: string | undefined = undefined;
  let currentLines: string[] = [];

  for (const line of lines) {
    if (/^#{1,4}\s+/.test(line)) {
      if (currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentLines.join("\n").trim(),
        });
      }
      currentHeading = line.replace(/^#+\s+/, "").trim();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentLines.join("\n").trim(),
    });
  }

  return sections.filter((s) => s.content.length > 0);
}

function chunkSection(
  text: string,
  heading: string | undefined,
  maxTokens: number,
  overlapTokens: number,
  language: "fr" | "en",
): Omit<Chunk, "index">[] {
  const totalTokens = countTokens(text, language);

  // If the section fits in one chunk, return it
  if (totalTokens <= maxTokens) {
    return [
      {
        content: text,
        tokenCount: totalTokens,
        metadata: { heading, section: heading },
      },
    ];
  }

  // Split by paragraphs first
  const paragraphs = text.split(PARAGRAPH_BREAK).filter((p) => p.trim());
  const chunks: Omit<Chunk, "index">[] = [];
  let currentContent = "";
  let currentTokens = 0;

  for (const para of paragraphs) {
    const paraTokens = countTokens(para, language);

    // If a single paragraph is too large, split by sentences
    if (paraTokens > maxTokens) {
      // Flush current buffer
      if (currentContent.trim()) {
        chunks.push({
          content: currentContent.trim(),
          tokenCount: currentTokens,
          metadata: { heading, section: heading },
        });
      }

      const sentenceChunks = chunkBySentences(
        para,
        heading,
        maxTokens,
        language,
      );
      chunks.push(...sentenceChunks);
      currentContent = "";
      currentTokens = 0;
      continue;
    }

    if (currentTokens + paraTokens > maxTokens && currentContent.trim()) {
      chunks.push({
        content: currentContent.trim(),
        tokenCount: currentTokens,
        metadata: { heading, section: heading },
      });

      // Add overlap from the end of the previous chunk
      const overlapText = getOverlapText(currentContent, overlapTokens, language);
      currentContent = overlapText + "\n\n" + para;
      currentTokens = countTokens(currentContent, language);
    } else {
      currentContent += (currentContent ? "\n\n" : "") + para;
      currentTokens += paraTokens;
    }
  }

  if (currentContent.trim()) {
    chunks.push({
      content: currentContent.trim(),
      tokenCount: countTokens(currentContent, language),
      metadata: { heading, section: heading },
    });
  }

  return chunks;
}

function chunkBySentences(
  text: string,
  heading: string | undefined,
  maxTokens: number,
  language: "fr" | "en",
): Omit<Chunk, "index">[] {
  const sentences = text.split(SENTENCE_BREAK).filter((s) => s.trim());
  const chunks: Omit<Chunk, "index">[] = [];
  let currentContent = "";
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentTokens = countTokens(sentence, language);

    if (currentTokens + sentTokens > maxTokens && currentContent.trim()) {
      chunks.push({
        content: currentContent.trim(),
        tokenCount: currentTokens,
        metadata: { heading, section: heading },
      });
      currentContent = sentence;
      currentTokens = sentTokens;
    } else {
      currentContent += (currentContent ? " " : "") + sentence;
      currentTokens += sentTokens;
    }
  }

  if (currentContent.trim()) {
    chunks.push({
      content: currentContent.trim(),
      tokenCount: countTokens(currentContent, language),
      metadata: { heading, section: heading },
    });
  }

  return chunks;
}

function getOverlapText(
  text: string,
  overlapTokens: number,
  language: "fr" | "en",
): string {
  const words = text.split(/\s+/);
  const ratio = language === "fr" ? 3.8 : 3.5;
  // Approximate: each word is ~5 chars = ~1.3 tokens
  const wordsNeeded = Math.ceil(overlapTokens * (ratio / 5));
  return words.slice(-wordsNeeded).join(" ");
}
