-- Migration 0025: Performance indexes for admin pagination, search and school leaderboards
--
-- Why: sprints 2 & 3 introduced new hot query patterns that aren't covered by
-- existing indexes (0018_add_critical_indexes.sql). Without these, a 10K MAU
-- workload will start sequential-scanning the following tables:
--
--   * teacher_applications   -- admin paginated list + ILIKE search
--   * private_lesson_applications -- admin paginated list + ILIKE search
--   * schools                -- type-filtered leaderboards + name search
--
-- Safe to run multiple times (IF NOT EXISTS on every statement).
-- Idempotent; does not rewrite data.
--
-- Deployment note: on Supabase hosted PG, these tables are small (~thousands of
-- rows) so plain CREATE INDEX is fine. If any table ever grows past ~500K rows,
-- re-run future index additions with CREATE INDEX CONCURRENTLY to avoid
-- write locks.

-- pg_trgm is required for gin_trgm_ops (already enabled in 0003; re-stated
-- here so this migration is self-contained and safe to run on a fresh DB).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===========================================================================
-- teacher_applications  (admin paginated list)
-- ===========================================================================
-- Query shape (db/queries.ts :: getTeacherApplicationsPaginated):
--   SELECT ...
--   FROM   teacher_applications
--   WHERE  status = ?                               -- indexed
--     AND (teacher_name   ILIKE '%q%'
--       OR teacher_surname ILIKE '%q%'
--       OR teacher_email   ILIKE '%q%'
--       OR field           ILIKE '%q%')
--   ORDER BY created_at DESC
--   LIMIT ?;

-- Composite (status, created_at DESC) -- covers the common "all pending, newest
-- first" admin view without needing a separate sort step.
CREATE INDEX IF NOT EXISTS "idx_teacher_apps_status_created_at"
  ON "teacher_applications" ("status", "created_at" DESC);

-- Standalone created_at for the unfiltered "all statuses" case.
CREATE INDEX IF NOT EXISTS "idx_teacher_apps_created_at"
  ON "teacher_applications" ("created_at" DESC);

-- Trigram GIN indexes for case-insensitive substring search.
-- A standard btree/text_pattern_ops index cannot satisfy ILIKE '%q%' because
-- of the leading wildcard; pg_trgm GIN is the right tool here.
CREATE INDEX IF NOT EXISTS "idx_teacher_apps_name_trgm"
  ON "teacher_applications" USING gin ("teacher_name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_teacher_apps_surname_trgm"
  ON "teacher_applications" USING gin ("teacher_surname" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_teacher_apps_email_trgm"
  ON "teacher_applications" USING gin ("teacher_email" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_teacher_apps_field_trgm"
  ON "teacher_applications" USING gin ("field" gin_trgm_ops);

-- ===========================================================================
-- private_lesson_applications  (admin paginated list)
-- ===========================================================================
-- Query shape (db/queries.ts :: getStudentApplicationsPaginated):
--   Same as teacher_applications but on student_* columns, status is TEXT
--   (not an enum) and NULL is treated as 'pending'.

-- Pre-0025 the only index here was user_id. These three cover the pagination
-- fast paths.
CREATE INDEX IF NOT EXISTS "idx_student_apps_status"
  ON "private_lesson_applications" ("status");
CREATE INDEX IF NOT EXISTS "idx_student_apps_created_at"
  ON "private_lesson_applications" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_student_apps_status_created_at"
  ON "private_lesson_applications" ("status", "created_at" DESC);

-- Trigram indexes for ILIKE '%q%' search.
CREATE INDEX IF NOT EXISTS "idx_student_apps_name_trgm"
  ON "private_lesson_applications" USING gin ("student_name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_student_apps_surname_trgm"
  ON "private_lesson_applications" USING gin ("student_surname" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_student_apps_email_trgm"
  ON "private_lesson_applications" USING gin ("student_email" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_student_apps_field_trgm"
  ON "private_lesson_applications" USING gin ("field" gin_trgm_ops);

-- ===========================================================================
-- schools  (leaderboard + name search)
-- ===========================================================================
-- Query shapes:
--   (a) getSchoolPointsByType:
--         SELECT ... FROM schools
--         WHERE  type = ? [AND city = ?]
--         ORDER BY total_points DESC, name ASC
--         LIMIT ?;
--   (b) /api/schools (search):
--         SELECT ... FROM schools
--         WHERE  name ILIKE '%q%' [AND city = ?] [AND category = ?]
--         LIMIT ?;
--
-- Note: 0006_add_school_location_fields.sql already created
-- idx_schools_name_ilike ON schools (name text_pattern_ops) which only helps
-- prefix matches (LIKE 'q%'). It cannot serve ILIKE '%q%' with a leading
-- wildcard, so we add a trigram index here.

-- Leaderboard: (type, total_points DESC) lets Postgres scan the first N
-- matching rows in index order, no extra sort needed.
CREATE INDEX IF NOT EXISTS "idx_schools_type_points"
  ON "schools" ("type", "total_points" DESC);

-- Leaderboard (type + city filter): covers the city-scoped path of the same
-- query without falling back to a full type scan.
CREATE INDEX IF NOT EXISTS "idx_schools_type_city_points"
  ON "schools" ("type", "city", "total_points" DESC);

-- Case-insensitive substring search on school name. Complements, not replaces,
-- the existing text_pattern_ops prefix index -- Postgres will pick the cheaper
-- one per query.
CREATE INDEX IF NOT EXISTS "idx_schools_name_trgm"
  ON "schools" USING gin ("name" gin_trgm_ops);
