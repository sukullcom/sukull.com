-- 0055: Promotions / giveaways
--
-- Admin-managed campaigns rendered as an eye-catching banner above the
-- daily-progress / daily-challenge widgets on the learn dashboard. Each
-- campaign can collect entries from authenticated users (one per user) and
-- supports an admin-driven random winner pick.
--
-- The schema mirrors db/schema.ts (`promotions`, `promotion_entries`). Keep
-- the two in sync: Drizzle reads the column types but DDL is applied via this
-- file (db:apply) because index/RLS migrations are not tracked by drizzle-kit
-- push.

-- =============================================================================
-- Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id               SERIAL PRIMARY KEY,
  -- Open-ended (text rather than enum) so adding new banner kinds doesn't
  -- need a migration. UI defaults to 'giveaway'.
  kind             TEXT NOT NULL DEFAULT 'giveaway',
  title            TEXT NOT NULL,
  description      TEXT,
  prize            TEXT NOT NULL,
  cta_label        TEXT NOT NULL DEFAULT 'Çekilişe Katıl',
  rules            TEXT,
  accent_color     TEXT NOT NULL DEFAULT 'violet',
  image_url        TEXT,
  starts_at        TIMESTAMPTZ NOT NULL,
  ends_at          TIMESTAMPTZ NOT NULL,
  -- Admin pause toggle: hides the banner even inside the time window.
  is_active        BOOLEAN NOT NULL DEFAULT true,
  winner_user_id   TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  winner_picked_at TIMESTAMPTZ,
  created_by       TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT promotions_ends_after_starts CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS promotions_active_window_idx
  ON public.promotions (is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS promotions_kind_idx
  ON public.promotions (kind);

CREATE TABLE IF NOT EXISTS public.promotion_entries (
  id            BIGSERIAL PRIMARY KEY,
  promotion_id  INTEGER NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One entry per (promotion, user). Idempotent join uses ON CONFLICT DO NOTHING.
CREATE UNIQUE INDEX IF NOT EXISTS promotion_entries_promotion_user_unique
  ON public.promotion_entries (promotion_id, user_id);

CREATE INDEX IF NOT EXISTS promotion_entries_promotion_idx
  ON public.promotion_entries (promotion_id);

CREATE INDEX IF NOT EXISTS promotion_entries_user_idx
  ON public.promotion_entries (user_id);

-- =============================================================================
-- updated_at trigger
-- =============================================================================
--
-- The admin UI relies on `updated_at` to surface "son güncelleme" timestamps;
-- a trigger guarantees that even raw UPDATEs touching only `is_active` bump
-- the column without the app layer needing to remember.

CREATE OR REPLACE FUNCTION public.touch_promotions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS promotions_set_updated_at ON public.promotions;
CREATE TRIGGER promotions_set_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_promotions_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
--
-- All reads/writes go through server actions running as the table owner
-- (Drizzle service connection), which bypasses RLS. The policies below
-- intentionally lock PostgREST/anon/authenticated direct access:
--   * promotions   → SELECT for authenticated (banner read needs none, but
--                    leaving SELECT open lets us prototype a public stats
--                    page later without a fresh migration)
--   * promotion_entries → no policy = no PostgREST access at all
--
-- INSERT/UPDATE/DELETE policies are deliberately absent so direct mutation
-- is impossible even with a leaked anon key.

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS promotions_select_authenticated ON public.promotions;
CREATE POLICY promotions_select_authenticated ON public.promotions
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE public.promotion_entries ENABLE ROW LEVEL SECURITY;
-- No SELECT policy: only server actions (table owner) can read.
