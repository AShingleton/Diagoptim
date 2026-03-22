-- Table des embeddings vectoriels
-- Utilise pgvector pour le stockage et la recherche de similarite
-- Dimension 1024 = modele Voyage AI voyage-3
-- Fallback: 384 pour gte-small (Supabase gratuit)

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chunk_id TEXT NOT NULL REFERENCES "KnowledgeChunk"(id) ON DELETE CASCADE,
  embedding vector(1024) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index HNSW pour la recherche rapide de similarite
CREATE INDEX IF NOT EXISTS idx_embeddings_hnsw
  ON knowledge_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index sur chunk_id pour les jointures
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_id
  ON knowledge_embeddings(chunk_id);

-- Fonction de recherche semantique
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_category text DEFAULT NULL,
  filter_language text DEFAULT 'fr',
  filter_knowledge_base_id text DEFAULT NULL
)
RETURNS TABLE (
  chunk_id text,
  document_id text,
  document_title text,
  chunk_content text,
  chunk_index int,
  category text,
  subcategory text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id::text AS chunk_id,
    kd.id::text AS document_id,
    kd.title AS document_title,
    kc.content AS chunk_content,
    kc."chunkIndex" AS chunk_index,
    kd.category,
    kd.subcategory,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM knowledge_embeddings ke
  JOIN "KnowledgeChunk" kc ON kc.id = ke.chunk_id
  JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
  JOIN "KnowledgeBase" kb ON kb.id = kd."knowledgeBaseId"
  WHERE kd.status = 'READY'
    AND kd.language = filter_language
    AND (filter_category IS NULL OR kd.category = filter_category)
    AND (filter_knowledge_base_id IS NULL OR kd."knowledgeBaseId" = filter_knowledge_base_id)
    AND 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fonction de recherche hybride (semantique + textuelle)
CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
  query_text text,
  query_embedding vector(1024),
  match_count int DEFAULT 10,
  semantic_weight float DEFAULT 0.7,
  text_weight float DEFAULT 0.3,
  filter_category text DEFAULT NULL,
  filter_language text DEFAULT 'fr'
)
RETURNS TABLE (
  chunk_id text,
  document_id text,
  document_title text,
  chunk_content text,
  category text,
  combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id::text,
    kd.id::text,
    kd.title,
    kc.content,
    kd.category,
    (
      semantic_weight * (1 - (ke.embedding <=> query_embedding)) +
      text_weight * COALESCE(ts_rank(to_tsvector('french', kc.content), plainto_tsquery('french', query_text)), 0)
    ) AS combined_score
  FROM knowledge_embeddings ke
  JOIN "KnowledgeChunk" kc ON kc.id = ke.chunk_id
  JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
  WHERE kd.status = 'READY'
    AND kd.language = filter_language
    AND (filter_category IS NULL OR kd.category = filter_category)
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Index full-text sur le contenu des chunks (pour la recherche hybride)
CREATE INDEX IF NOT EXISTS idx_chunks_fulltext
  ON "KnowledgeChunk"
  USING gin(to_tsvector('french', content));
