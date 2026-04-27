-- Learning path: filter courses (LGS / TYT+AYT / adult exams) + onboarding gate.
-- Existing users: full catalog access (legacy).

ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "learning_path" text;
ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "student_grade" integer;
ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamptz;
ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "learning_path_last_set_at" timestamptz;
ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "learning_path_change_count" integer NOT NULL DEFAULT 0;

UPDATE "user_progress"
SET
  "learning_path" = 'full',
  "onboarding_completed_at" = COALESCE("onboarding_completed_at", NOW())
WHERE "onboarding_completed_at" IS NULL;
