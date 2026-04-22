-- =============================================================================
-- activity_log scalability: JSONB metadata + 90-day TTL + daily rollup table
-- =============================================================================
-- Rationale:
--   At 10k+ monthly active users the raw activity_log table grows by millions
--   of rows per month. Three changes keep it sustainable without losing
--   analytic value:
--     1) metadata TEXT -> JSONB (queryable without `json_parse` at read time)
--     2) A daily rollup (activity_log_daily) so historic analytics survive
--        even after raw rows are pruned.
--     3) A cleanup function executed by the daily cron: aggregates the last
--        day into the rollup, then deletes raw rows older than 90 days.
-- =============================================================================

-- 1) Convert metadata column to JSONB (safe; nulls and valid JSON stay intact,
--    legacy non-JSON strings are wrapped as {"raw": <text>}).
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'activity_log'
     AND column_name = 'metadata';

  IF col_type IS NOT NULL AND col_type <> 'jsonb' THEN
    ALTER TABLE activity_log
      ALTER COLUMN metadata TYPE jsonb
      USING CASE
        WHEN metadata IS NULL THEN NULL
        WHEN metadata ~ '^\s*[\{\[]' THEN metadata::jsonb
        ELSE jsonb_build_object('raw', metadata)
      END;
  END IF;
END $$;

-- 2) Daily rollup: one row per (day, event_type, page) with user counts.
CREATE TABLE IF NOT EXISTS activity_log_daily (
  day           DATE        NOT NULL,
  event_type    TEXT        NOT NULL,
  page          TEXT,
  event_count   INTEGER     NOT NULL DEFAULT 0,
  unique_users  INTEGER     NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (day, event_type, page)
);

CREATE INDEX IF NOT EXISTS activity_log_daily_day_idx
  ON activity_log_daily (day DESC);
CREATE INDEX IF NOT EXISTS activity_log_daily_event_idx
  ON activity_log_daily (event_type, day DESC);

-- 3) Rollup + retention function.
CREATE OR REPLACE FUNCTION cleanup_activity_log(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  rolled_up  INTEGER := 0;
  deleted    INTEGER := 0;
  cutoff     TIMESTAMPTZ := NOW() - make_interval(days => GREATEST(p_retention_days, 7));
BEGIN
  -- Re-aggregate any day that either doesn't exist in the rollup or that had
  -- new raw rows since the rollup was last written (24h rolling window covers
  -- today and yesterday to tolerate late arrivals).
  WITH source AS (
    SELECT
      (created_at AT TIME ZONE 'UTC')::date AS day,
      event_type,
      page,
      COUNT(*)::int               AS event_count,
      COUNT(DISTINCT user_id)::int AS unique_users
    FROM activity_log
    WHERE created_at >= NOW() - INTERVAL '2 days'
    GROUP BY 1, 2, 3
  )
  INSERT INTO activity_log_daily AS d (day, event_type, page, event_count, unique_users, updated_at)
  SELECT day, event_type, page, event_count, unique_users, NOW()
    FROM source
  ON CONFLICT (day, event_type, page)
    DO UPDATE SET event_count  = EXCLUDED.event_count,
                  unique_users = EXCLUDED.unique_users,
                  updated_at   = NOW();
  GET DIAGNOSTICS rolled_up = ROW_COUNT;

  -- Prune raw rows older than the retention window. The rollup above already
  -- captured everything from the last 2 days, and older days were rolled up
  -- on earlier cron runs.
  DELETE FROM activity_log WHERE created_at < cutoff;
  GET DIAGNOSTICS deleted = ROW_COUNT;

  RETURN json_build_object(
    'rolled_up_rows', rolled_up,
    'deleted_rows',   deleted,
    'cutoff',         cutoff
  );
END $$;
