-- Partial index for the İstikrar leaderboard tab.
--
-- Query shape (`getTopUsersByStreak`):
--   SELECT user_id, user_name, user_image_src, istikrar
--   FROM   user_progress
--   WHERE  istikrar > 0
--   ORDER  BY istikrar DESC, points DESC
--   LIMIT  ? OFFSET ?;
--
-- Zero-streak rows are excluded from the list (and this index), so the
-- scan stays proportional to active streaks rather than every registered
-- user. Tie-break is points so equal streaks stay stable.
--
-- Safe to re-run (IF NOT EXISTS). Plain CREATE INDEX is fine at current
-- user_progress size; switch to CONCURRENTLY if the table exceeds ~500K rows.

CREATE INDEX IF NOT EXISTS idx_user_progress_istikrar_leaderboard
  ON user_progress (istikrar DESC, points DESC)
  WHERE istikrar > 0;
