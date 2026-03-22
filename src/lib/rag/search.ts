/**
 * RAG SEARCH — RETRIEVAL
 *
 * Searches for the most relevant chunks for a given query.
 *
 * 3 search modes:
 * 1. Semantic (cosine similarity on embeddings)
 * 2. Text (full-text search PostgreSQL)
 * 3. Hybrid (weighted combination of both) — RECOMMENDED
 *
 * Filters: knowledge base, category, subcategory, language, tags, owner
 *
 * @module rag/search
 */

import { prisma } from "@/lib/prisma";
import { getEmbeddingProvider } from "./embeddings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchOptions {
  query: string;
  mode?: "semantic" | "text" | "hybrid";
  limit?: number;
  threshold?: number;
  category?: string;
  subcategory?: string;
  language?: "fr" | "en";
  knowledgeBaseId?: string;
  tags?: string[];
  includePrivate?: boolean;
  userId?: string;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  category: string | null;
  subcategory: string | null;
  similarity: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Main search function
// ---------------------------------------------------------------------------

export async function searchKnowledge(
  options: SearchOptions,
): Promise<SearchResult[]> {
  const {
    query,
    mode = "hybrid",
    limit = 10,
    threshold = 0.7,
    category = null,
    language = "fr",
    knowledgeBaseId = null,
  } = options;

  if (mode === "text") {
    return textSearch(query, limit, category, language);
  }

  // Generate query embedding
  const provider = getEmbeddingProvider();
  const queryEmbedding = await provider.generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  if (mode === "semantic") {
    const results = await prisma.$queryRawUnsafe<SearchResult[]>(
      `SELECT * FROM search_knowledge($1::vector, $2, $3, $4, $5, $6)`,
      vectorStr,
      threshold,
      limit,
      category,
      language,
      knowledgeBaseId,
    );
    return results;
  }

  // Hybrid search
  const results = await prisma.$queryRawUnsafe<SearchResult[]>(
    `SELECT * FROM hybrid_search_knowledge($1, $2::vector, $3, 0.7, 0.3, $4, $5)`,
    query,
    vectorStr,
    limit,
    category,
    language,
  );

  return results;
}

// ---------------------------------------------------------------------------
// Text-only search
// ---------------------------------------------------------------------------

async function textSearch(
  query: string,
  limit: number,
  category: string | null,
  language: string,
): Promise<SearchResult[]> {
  const config = language === "fr" ? "french" : "english";

  const chunks = await prisma.$queryRawUnsafe<
    {
      chunk_id: string;
      document_id: string;
      document_title: string;
      chunk_content: string;
      category: string | null;
      subcategory: string | null;
      rank: number;
    }[]
  >(
    `SELECT
       kc.id AS chunk_id,
       kd.id AS document_id,
       kd.title AS document_title,
       kc.content AS chunk_content,
       kd.category,
       kd.subcategory,
       ts_rank(to_tsvector('${config}', kc.content), plainto_tsquery('${config}', $1)) AS rank
     FROM "KnowledgeChunk" kc
     JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
     WHERE kd.status = 'READY'
       AND kd.language = $2
       AND ($3::text IS NULL OR kd.category = $3)
       AND to_tsvector('${config}', kc.content) @@ plainto_tsquery('${config}', $1)
     ORDER BY rank DESC
     LIMIT $4`,
    query,
    language,
    category,
    limit,
  );

  return chunks.map((c) => ({
    chunkId: c.chunk_id,
    documentId: c.document_id,
    documentTitle: c.document_title,
    content: c.chunk_content,
    category: c.category,
    subcategory: c.subcategory,
    similarity: c.rank,
  }));
}

// ---------------------------------------------------------------------------
// Context retrieval for the diagnostic engine
// ---------------------------------------------------------------------------

/**
 * Retrieves relevant knowledge context for the diagnostic AI.
 * Combines company profile, current question, and waste category
 * to find the best matching knowledge base content.
 */
export async function getRelevantContext(
  currentQuestion: string,
  category: string,
  options?: {
    sector?: string;
    language?: "fr" | "en";
    limit?: number;
  },
): Promise<string> {
  const language = options?.language ?? "fr";
  const limit = options?.limit ?? 5;

  // Build a contextual query
  const contextQuery = options?.sector
    ? `${currentQuestion} ${category} secteur ${options.sector}`
    : `${currentQuestion} ${category}`;

  const results = await searchKnowledge({
    query: contextQuery,
    mode: "hybrid",
    limit,
    threshold: 0.5,
    category: mapCategoryToKnowledge(category),
    language,
  });

  if (results.length === 0) return "";

  // Format the results as context for the AI prompt
  const contextParts = results.map(
    (r, i) =>
      `[Source ${i + 1}: ${r.documentTitle}]\n${r.content}`,
  );

  return contextParts.join("\n\n---\n\n");
}

/**
 * Maps diagnostic waste categories to knowledge base categories.
 */
function mapCategoryToKnowledge(wasteCategory: string): string | undefined {
  const mapping: Record<string, string> = {
    transport: "lean",
    inventory: "lean",
    motion: "lean",
    waiting: "lean",
    overproduction: "lean",
    overprocessing: "lean",
    defects: "lean",
    skills: "lean",
    strategy: "strategy",
    framing: "lean",
    profile: "benchmark",
  };
  return mapping[wasteCategory];
}
