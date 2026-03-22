/**
 * DOCUMENT INGESTION PIPELINE
 *
 * Full flow:
 * 1. Upload or URL -> Supabase Storage
 * 2. Extract raw text (PDF, DOCX, TXT, HTML, Markdown)
 * 3. Clean and normalize text
 * 4. Intelligent chunking (respects headings, paragraphs)
 * 5. Generate embeddings by batch
 * 6. Store embeddings in pgvector
 * 7. Update status -> READY
 *
 * @module rag/ingestion
 */

import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { chunkDocument, type Chunk } from "./chunker";
import { generateAndStoreEmbeddings } from "./embeddings";
import type { DocumentSourceType, KnowledgeDocStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IngestionOptions {
  knowledgeBaseId: string;
  title: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  language?: "fr" | "en";
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, unknown>;
}

export interface IngestionResult {
  documentId: string;
  status: KnowledgeDocStatus;
  totalChunks: number;
  totalTokens: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Supabase admin client
// ---------------------------------------------------------------------------

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  );
}

// ---------------------------------------------------------------------------
// Main ingestion function
// ---------------------------------------------------------------------------

export async function ingestDocument(
  file: Buffer | string,
  sourceType: DocumentSourceType,
  options: IngestionOptions,
): Promise<IngestionResult> {
  // 1. Create the document record
  const doc = await prisma.knowledgeDocument.create({
    data: {
      knowledgeBaseId: options.knowledgeBaseId,
      title: options.title,
      sourceType,
      language: options.language ?? "fr",
      category: options.category,
      subcategory: options.subcategory,
      tags: options.tags ?? [],
      metadata: (options.metadata ?? {}) as Record<string, string>,
      status: "PENDING",
    },
  });

  try {
    // 2. Upload to Supabase Storage if it's a file buffer
    if (Buffer.isBuffer(file)) {
      await updateStatus(doc.id, "EXTRACTING");
      const storagePath = `knowledge/${doc.id}/${options.title}`;
      const { error: uploadError } = await getSupabaseAdmin()
        .storage.from("knowledge")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      await prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { sourceUrl: storagePath },
      });
    }

    // 3. Extract raw text
    await updateStatus(doc.id, "EXTRACTING");
    const rawText = await extractText(file, sourceType);

    await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { rawText },
    });

    // 4. Chunk the text
    await updateStatus(doc.id, "CHUNKING");
    const chunks = chunkDocument(rawText, {
      maxTokens: options.chunkSize ?? 500,
      overlapTokens: options.chunkOverlap ?? 50,
      language: options.language ?? "fr",
    });

    // 5. Store chunks in DB
    const createdChunks = await storeChunks(doc.id, chunks);

    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
    await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { totalChunks: chunks.length, totalTokens },
    });

    // 6. Generate and store embeddings
    await updateStatus(doc.id, "EMBEDDING");
    await generateAndStoreEmbeddings(
      createdChunks.map((c, i) => ({
        id: c.id,
        content: chunks[i].content,
      })),
    );

    // 7. Mark as READY
    await updateStatus(doc.id, "READY");

    return {
      documentId: doc.id,
      status: "READY",
      totalChunks: chunks.length,
      totalTokens,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { status: "ERROR", processingError: message },
    });
    return {
      documentId: doc.id,
      status: "ERROR",
      totalChunks: 0,
      totalTokens: 0,
      error: message,
    };
  }
}

// ---------------------------------------------------------------------------
// Batch ingestion
// ---------------------------------------------------------------------------

export async function ingestBatch(
  items: {
    file: Buffer | string;
    sourceType: DocumentSourceType;
    options: IngestionOptions;
  }[],
): Promise<IngestionResult[]> {
  const results: IngestionResult[] = [];
  for (const item of items) {
    const result = await ingestDocument(item.file, item.sourceType, item.options);
    results.push(result);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Ingest from URL
// ---------------------------------------------------------------------------

export async function ingestFromUrl(
  url: string,
  options: IngestionOptions,
): Promise<IngestionResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }
  const text = await response.text();
  return ingestDocument(text, "URL", { ...options, metadata: { ...options.metadata, sourceUrl: url } });
}

// ---------------------------------------------------------------------------
// Ingest raw text (manual entry)
// ---------------------------------------------------------------------------

export async function ingestText(
  text: string,
  options: IngestionOptions,
): Promise<IngestionResult> {
  return ingestDocument(text, "MANUAL", options);
}

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

async function extractText(
  input: Buffer | string,
  sourceType: DocumentSourceType,
): Promise<string> {
  // If it's already a string (text, URL content, manual), return directly
  if (typeof input === "string") {
    if (sourceType === "HTML") {
      return stripHtml(input);
    }
    return input;
  }

  // Buffer-based extraction
  switch (sourceType) {
    case "PDF": {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(input);
      return result.text;
    }
    case "DOCX": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: input });
      return result.value;
    }
    case "TXT":
    case "MARKDOWN":
    case "CSV":
      return input.toString("utf-8");
    case "HTML":
      return stripHtml(input.toString("utf-8"));
    default:
      return input.toString("utf-8");
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function updateStatus(docId: string, status: KnowledgeDocStatus) {
  await prisma.knowledgeDocument.update({
    where: { id: docId },
    data: { status },
  });
}

async function storeChunks(documentId: string, chunks: Chunk[]) {
  const created = [];
  for (const chunk of chunks) {
    const record = await prisma.knowledgeChunk.create({
      data: {
        documentId,
        chunkIndex: chunk.index,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        metadata: chunk.metadata as Record<string, string>,
      },
    });
    created.push(record);
  }
  return created;
}
