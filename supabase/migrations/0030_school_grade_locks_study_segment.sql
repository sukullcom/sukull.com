-- Okul / sınıf değişim kilidi (6 ay) + Study Buddy gönderilerinde öğrenme yolu

ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "school_change_locked_until" timestamptz;
ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "student_grade_change_locked_until" timestamptz;

-- Mevcut kullanıcılar: onboarding tarihinden +6 ay kilidi (geçmişse hemen değiştirilebilir)
UPDATE "user_progress" up
SET "school_change_locked_until" = COALESCE(up.onboarding_completed_at, NOW()) + interval '6 months'
WHERE up."school_id" IS NOT NULL
  AND up."school_change_locked_until" IS NULL;

UPDATE "user_progress" up
SET "student_grade_change_locked_until" = COALESCE(up.onboarding_completed_at, NOW()) + interval '6 months'
WHERE up."student_grade" IS NOT NULL
  AND up."student_grade_change_locked_until" IS NULL;

ALTER TABLE "study_buddy_posts" ADD COLUMN IF NOT EXISTS "learning_path" text;

UPDATE "study_buddy_posts" p
SET "learning_path" = COALESCE(up."learning_path", 'full')
FROM "user_progress" up
WHERE up."user_id" = p."user_id"
  AND (p."learning_path" IS NULL OR p."learning_path" = '');

UPDATE "study_buddy_posts"
SET "learning_path" = 'full'
WHERE "learning_path" IS NULL OR "learning_path" = '';

ALTER TABLE "study_buddy_posts" ALTER COLUMN "learning_path" SET DEFAULT 'full';
ALTER TABLE "study_buddy_posts" ALTER COLUMN "learning_path" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_study_buddy_posts_learning_path" ON "study_buddy_posts" ("learning_path");
