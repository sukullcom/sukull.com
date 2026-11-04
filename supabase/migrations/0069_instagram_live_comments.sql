-- Instagram canlı yayın ve gönderi yorumları.
-- Yazma sunucu (Drizzle) bağlantısından yapılır. PostgREST’e politika verilmez.

CREATE TABLE IF NOT EXISTS public.instagram_live_comments (
  id bigserial PRIMARY KEY,
  comment_id text NOT NULL,
  field text NOT NULL,
  body text NOT NULL DEFAULT '',
  username text,
  commenter_id text,
  media_id text,
  media_product_type text,
  account_id text,
  parent_id text,
  event_time timestamptz,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS instagram_live_comments_comment_id_key
  ON public.instagram_live_comments (comment_id);

CREATE INDEX IF NOT EXISTS instagram_live_comments_received_idx
  ON public.instagram_live_comments (received_at DESC);

CREATE INDEX IF NOT EXISTS instagram_live_comments_media_idx
  ON public.instagram_live_comments (media_id);

ALTER TABLE public.instagram_live_comments ENABLE ROW LEVEL SECURITY;
