ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "last_heart_regen_at" timestamp;
ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "streak_freeze_count" integer NOT NULL DEFAULT 0;
