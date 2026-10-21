-- Hizmet pazaryeri e-postaları: ilan özeti tercihi ve gönderim tekrarı kaydı.
-- Yazma yalnızca sunucu bağlantısından. İstemci anahtarı bu tablolara erişemez.

CREATE TABLE IF NOT EXISTS public.marketplace_notification_prefs (
  user_id text PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  digest_enabled boolean NOT NULL DEFAULT true,
  last_digest_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.marketplace_email_sends (
  id serial PRIMARY KEY,
  kind text NOT NULL,
  ref text NOT NULL,
  user_id text REFERENCES public.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_email_sends_kind_chk CHECK (kind IN ('quote', 'accepted', 'digest')),
  CONSTRAINT marketplace_email_sends_kind_ref UNIQUE (kind, ref)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_email_sends_created
  ON public.marketplace_email_sends (created_at DESC);

ALTER TABLE public.marketplace_notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_email_sends ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.marketplace_notification_prefs FROM anon, authenticated;
REVOKE ALL ON public.marketplace_email_sends FROM anon, authenticated;
