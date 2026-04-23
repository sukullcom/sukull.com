-- Admin audit log: records every privileged action taken by an admin
-- (role changes, application approvals, course edits, etc.).
--
-- Retention is controlled by `cleanup_admin_audit()`; default is 365 days,
-- which is long enough for incident forensics but short enough to stay
-- lightweight. The consolidated daily cron trims rows past the window.

CREATE TABLE IF NOT EXISTS admin_audit (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id     TEXT NOT NULL,                -- admin user.id (supabase auth uuid as text)
  actor_email  TEXT,
  action       TEXT NOT NULL,                -- machine-readable key, e.g. "teacher_application.approve"
  target_type  TEXT,                         -- e.g. "user", "course", "teacher_application"
  target_id    TEXT,                         -- id of the target entity (nullable for global actions)
  ip           TEXT,
  user_agent   TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS admin_audit_created_at_idx
  ON admin_audit (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_actor_created_idx
  ON admin_audit (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_action_created_idx
  ON admin_audit (action, created_at DESC);

-- GIN on the action label allows fast "contains" filtering in the admin UI.
CREATE INDEX IF NOT EXISTS admin_audit_target_idx
  ON admin_audit (target_type, target_id);

-- Retention: remove rows older than N days (default 365).
CREATE OR REPLACE FUNCTION cleanup_admin_audit(p_retention_days INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM admin_audit
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
