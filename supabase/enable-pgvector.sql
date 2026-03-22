-- Activer l'extension pgvector dans Supabase
-- A executer dans l'editeur SQL Supabase AVANT le reste

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- Pour la recherche textuelle aussi

-- Verification
SELECT * FROM pg_extension WHERE extname = 'vector';
