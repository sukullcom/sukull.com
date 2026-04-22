-- Critical performance indexes for high-traffic queries
-- Safe to run multiple times (IF NOT EXISTS)

-- === users ===
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");

-- === challenges / challenge_options / challenge_progress ===
CREATE INDEX IF NOT EXISTS "idx_challenges_lesson_id" ON "challenges" ("lesson_id");
CREATE INDEX IF NOT EXISTS "idx_challenge_options_challenge_id" ON "challenge_options" ("challenge_id");
CREATE INDEX IF NOT EXISTS "idx_challenge_progress_user_id" ON "challenge_progress" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_challenge_progress_user_challenge"
  ON "challenge_progress" ("user_id", "challenge_id");

-- === course hierarchy ===
CREATE INDEX IF NOT EXISTS "idx_units_course_id" ON "units" ("course_id");
CREATE INDEX IF NOT EXISTS "idx_lessons_unit_id" ON "lessons" ("unit_id");

-- === user_progress (school & course lookups) ===
CREATE INDEX IF NOT EXISTS "idx_user_progress_school_id" ON "user_progress" ("school_id");
CREATE INDEX IF NOT EXISTS "idx_user_progress_active_course" ON "user_progress" ("active_course_id");

-- === study buddy ===
CREATE INDEX IF NOT EXISTS "idx_study_buddy_messages_chat_created"
  ON "study_buddy_messages" ("chat_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_study_buddy_posts_user" ON "study_buddy_posts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_study_buddy_posts_created" ON "study_buddy_posts" ("created_at" DESC);

-- === lesson reviews (teacher dashboards) ===
CREATE UNIQUE INDEX IF NOT EXISTS "idx_lesson_reviews_booking" ON "lesson_reviews" ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_lesson_reviews_teacher" ON "lesson_reviews" ("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_lesson_reviews_student" ON "lesson_reviews" ("student_id");

-- === teacher fields (shown on private-lesson teacher listing) ===
CREATE INDEX IF NOT EXISTS "idx_teacher_fields_teacher" ON "teacher_fields" ("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_teacher_fields_active"
  ON "teacher_fields" ("teacher_id", "is_active");

-- === teacher applications ===
CREATE INDEX IF NOT EXISTS "idx_teacher_apps_user" ON "teacher_applications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_teacher_apps_status" ON "teacher_applications" ("status");

-- === daily streak (non-unique lookup for latest entry) ===
CREATE INDEX IF NOT EXISTS "idx_user_daily_streak_user"
  ON "user_daily_streak" ("user_id", "date" DESC);

-- === payment & credit logs ===
CREATE INDEX IF NOT EXISTS "idx_payment_logs_user" ON "payment_logs" ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_credit_tx_user_created"
  ON "credit_transactions" ("user_id", "created_at" DESC);
