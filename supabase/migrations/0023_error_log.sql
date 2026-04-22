-- =============================================================================
-- error_log: lightweight, Postgres-native error tracking
-- =============================================================================
-- Avoids external services (Sentry/Datadog) which add cost and a signup step.
-- The app writes structured error events here (server actions, API routes,
-- React error boundaries via /api/errors). A daily cleanup function prunes
-- rows older than 30 days so the table cannot grow unbounded.
-- =============================================================================

CREATE TABLE IF NOT EXISTS error_log (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Where it happened
  source        TEXT NOT NULL,            -- 'server-action' | 'api-route' | 'client' | 'middleware' | 'cron'
  location      TEXT,                     -- route path, function name, component name
  -- What happened
  level         TEXT NOT NULL DEFAULT 'error',  -- 'error' | 'warn' | 'fatal'
  message       TEXT NOT NULL,
  stack         TEXT,
  -- Context
  user_id       TEXT,                     -- Supabase auth user id (nullable, not a FK: we don't want cascades blocking logging)
  request_id    TEXT,                     -- correlation id for a single request
  metadata      JSONB,                    -- extra structured context
  user_agent    TEXT,
  url           TEXT
);

CREATE INDEX IF NOT EXISTS error_log_created_at_idx ON error_log (created_at DESC);
CREATE INDEX IF NOT EXISTS error_log_source_level_idx ON error_log (source, level, created_at DESC);
CREATE INDEX IF NOT EXISTS error_log_user_id_idx ON error_log (user_id) WHERE user_id IS NOT NULL;

-- Cleanup function: called by the daily cron. Returns how many rows were deleted.
CREATE OR REPLACE FUNCTION cleanup_error_log(p_retention_days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM error_log
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
