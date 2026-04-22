-- Distributed rate limiter backed by Postgres (Supabase)
-- Replaces the in-memory Map which doesn't work on Vercel serverless.

CREATE TABLE IF NOT EXISTS "rate_limits" (
  "key" TEXT PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_rate_limits_expires" ON "rate_limits" ("expires_at");

-- Atomic check-and-increment function.
-- Returns allowed=true if count stays within max_attempts, false otherwise.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_attempts INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ,
  current_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_expires_at TIMESTAMPTZ;
BEGIN
  INSERT INTO rate_limits AS rl (key, count, expires_at)
  VALUES (p_key, 1, NOW() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rl.expires_at < NOW() THEN 1
      ELSE rl.count + 1
    END,
    expires_at = CASE
      WHEN rl.expires_at < NOW() THEN NOW() + make_interval(secs => p_window_seconds)
      ELSE rl.expires_at
    END
  RETURNING rl.count, rl.expires_at INTO v_count, v_expires_at;

  RETURN QUERY SELECT
    (v_count <= p_max_attempts) AS allowed,
    GREATEST(0, p_max_attempts - v_count) AS remaining,
    v_expires_at AS reset_at,
    v_count AS current_count;
END;
$$;

-- Housekeeping: purge expired entries (called from daily cron)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
