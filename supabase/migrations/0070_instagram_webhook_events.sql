-- Instagram webhook teşhisi. Yorum çıkmasa da her POST bir satır bırakır.

CREATE TABLE IF NOT EXISTS public.instagram_webhook_events (
  id bigserial PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now(),
  outcome text NOT NULL,
  comment_count integer NOT NULL DEFAULT 0,
  note text
);

CREATE INDEX IF NOT EXISTS instagram_webhook_events_received_idx
  ON public.instagram_webhook_events (received_at DESC);

ALTER TABLE public.instagram_webhook_events ENABLE ROW LEVEL SECURITY;
