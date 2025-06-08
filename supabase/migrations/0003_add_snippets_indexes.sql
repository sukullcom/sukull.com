-- Add indexes to improve snippets query performance
-- Index for filtering by language
CREATE INDEX IF NOT EXISTS "snippets_language_idx" ON "snippets" ("language");

-- Index for filtering by user_id (for user snippet count queries)
CREATE INDEX IF NOT EXISTS "snippets_user_id_idx" ON "snippets" ("user_id");

-- Index for ordering by created_at (most common sort)
CREATE INDEX IF NOT EXISTS "snippets_created_at_idx" ON "snippets" ("created_at" DESC);

-- Composite index for language + created_at (for filtered and sorted queries)
CREATE INDEX IF NOT EXISTS "snippets_language_created_at_idx" ON "snippets" ("language", "created_at" DESC);

-- Text search indexes for ILIKE queries
CREATE INDEX IF NOT EXISTS "snippets_title_trgm_idx" ON "snippets" USING gin ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "snippets_user_name_trgm_idx" ON "snippets" USING gin ("user_name" gin_trgm_ops);

-- Enable pg_trgm extension for text search if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm; 