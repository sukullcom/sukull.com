-- LEGACY: `private_lesson_applications` was dropped in 0026_marketplace_refactor.sql.
-- Do not run on databases that have already applied 0026.
-- Add new columns to private_lesson_applications table
ALTER TABLE private_lesson_applications
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(); 