-- Add meetLink field to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "meet_link" TEXT; 