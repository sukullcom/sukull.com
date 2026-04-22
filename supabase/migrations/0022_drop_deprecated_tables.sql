-- =============================================================================
-- Drop deprecated tables that are no longer used by the application.
-- =============================================================================
--   • english_group_applications — old CEFR English-group signup flow (retired)
--   • quiz_questions / quiz_options — legacy quiz tables, replaced by the
--     unit/lesson/challenge model in the main Learn pipeline.
--
-- These tables had no FKs to active data and are safe to remove. Drop order
-- respects dependencies (quiz_options references quiz_questions).
-- =============================================================================

DROP TABLE IF EXISTS quiz_options CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS english_group_applications CASCADE;
