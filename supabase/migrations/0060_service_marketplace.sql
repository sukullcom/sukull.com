-- Ücretsiz hizmet pazaryeri. Özel ders listings / listing_offers tablolarına dokunmaz.
-- Platform komisyon veya teklif bedeli almaz; bu tablolar yalnızca ilan ve teklif kaydıdır.

CREATE TABLE IF NOT EXISTS public.marketplace_profiles (
  user_id text PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  city text,
  district text,
  neighborhood text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_services (
  user_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  service_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, service_slug)
);

CREATE INDEX IF NOT EXISTS idx_provider_services_slug
  ON public.provider_services (service_slug);

CREATE TABLE IF NOT EXISTS public.service_requests (
  id serial PRIMARY KEY,
  customer_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  service_slug text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  details text NOT NULL DEFAULT '',
  city text NOT NULL,
  district text NOT NULL,
  neighborhood text NOT NULL,
  timing_type text NOT NULL,
  scheduled_at timestamptz,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open',
  quote_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_requests_timing_chk CHECK (timing_type IN ('scheduled', 'two_months', 'six_months')),
  CONSTRAINT service_requests_status_chk CHECK (status IN ('open', 'accepted', 'expired')),
  CONSTRAINT service_requests_quote_count_chk CHECK (quote_count >= 0 AND quote_count <= 4)
);

CREATE INDEX IF NOT EXISTS idx_service_requests_customer
  ON public.service_requests (customer_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_open_feed
  ON public.service_requests (service_slug, status, expires_at);

CREATE TABLE IF NOT EXISTS public.service_quotes (
  id serial PRIMARY KEY,
  request_id integer NOT NULL REFERENCES public.service_requests (id) ON DELETE CASCADE,
  provider_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  price_tl integer NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_quotes_status_chk CHECK (status IN ('pending', 'accepted', 'rejected')),
  CONSTRAINT service_quotes_price_chk CHECK (price_tl > 0 AND price_tl <= 10000000)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_quotes_request_provider
  ON public.service_quotes (request_id, provider_id);
CREATE INDEX IF NOT EXISTS idx_service_quotes_provider
  ON public.service_quotes (provider_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.service_messages (
  id serial PRIMARY KEY,
  quote_id integer NOT NULL REFERENCES public.service_quotes (id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_messages_body_chk CHECK (char_length(body) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS idx_service_messages_quote
  ON public.service_messages (quote_id, created_at);

CREATE TABLE IF NOT EXISTS public.service_reviews (
  id serial PRIMARY KEY,
  quote_id integer NOT NULL UNIQUE REFERENCES public.service_quotes (id) ON DELETE CASCADE,
  request_id integer NOT NULL REFERENCES public.service_requests (id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  provider_id text NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  stars smallint NOT NULL,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_reviews_stars_chk CHECK (stars BETWEEN 1 AND 5),
  CONSTRAINT service_reviews_body_chk CHECK (char_length(body) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_service_reviews_provider
  ON public.service_reviews (provider_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_service_quote_cap() RETURNS trigger AS $$
DECLARE
  req record;
  active_count integer;
BEGIN
  SELECT status, expires_at, customer_id
    INTO req
    FROM public.service_requests
    WHERE id = NEW.request_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REQUEST_NOT_FOUND';
  END IF;
  IF req.customer_id = NEW.provider_id THEN
    RAISE EXCEPTION 'CANNOT_QUOTE_OWN_REQUEST';
  END IF;
  IF req.status <> 'open' OR req.expires_at <= now() THEN
    RAISE EXCEPTION 'REQUEST_NOT_OPEN';
  END IF;

  SELECT COUNT(*) INTO active_count
    FROM public.service_quotes
    WHERE request_id = NEW.request_id;

  IF active_count >= 4 THEN
    RAISE EXCEPTION 'QUOTE_CAP_REACHED';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_quote_cap ON public.service_quotes;
CREATE TRIGGER trg_service_quote_cap
  BEFORE INSERT ON public.service_quotes
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_service_quote_cap();

CREATE OR REPLACE FUNCTION public.bump_service_quote_count() RETURNS trigger AS $$
BEGIN
  UPDATE public.service_requests
    SET quote_count = quote_count + 1,
        updated_at = now()
    WHERE id = NEW.request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_quote_count ON public.service_quotes;
CREATE TRIGGER trg_service_quote_count
  AFTER INSERT ON public.service_quotes
  FOR EACH ROW
  EXECUTE PROCEDURE public.bump_service_quote_count();

ALTER TABLE public.marketplace_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketplace_profiles_own ON public.marketplace_profiles;
CREATE POLICY marketplace_profiles_own ON public.marketplace_profiles
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS provider_services_own ON public.provider_services;
CREATE POLICY provider_services_own ON public.provider_services
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS service_requests_select ON public.service_requests;
CREATE POLICY service_requests_select ON public.service_requests
  FOR SELECT TO authenticated
  USING (
    customer_id = (SELECT auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM public.service_quotes q
      WHERE q.request_id = service_requests.id
        AND q.provider_id = (SELECT auth.uid()::text)
    )
    OR (
      status = 'open'
      AND expires_at > now()
      AND quote_count < 4
      AND customer_id <> (SELECT auth.uid()::text)
      AND EXISTS (
        SELECT 1 FROM public.provider_services ps
        WHERE ps.user_id = (SELECT auth.uid()::text)
          AND ps.service_slug = service_requests.service_slug
      )
    )
  );

DROP POLICY IF EXISTS service_requests_insert_own ON public.service_requests;
CREATE POLICY service_requests_insert_own ON public.service_requests
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS service_requests_update_own ON public.service_requests;
CREATE POLICY service_requests_update_own ON public.service_requests
  FOR UPDATE TO authenticated
  USING (customer_id = (SELECT auth.uid()::text))
  WITH CHECK (customer_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS service_quotes_select ON public.service_quotes;
CREATE POLICY service_quotes_select ON public.service_quotes
  FOR SELECT TO authenticated
  USING (
    provider_id = (SELECT auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = service_quotes.request_id
        AND r.customer_id = (SELECT auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS service_quotes_insert_own ON public.service_quotes;
CREATE POLICY service_quotes_insert_own ON public.service_quotes
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS service_quotes_update_customer ON public.service_quotes;
CREATE POLICY service_quotes_update_customer ON public.service_quotes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = service_quotes.request_id
        AND r.customer_id = (SELECT auth.uid()::text)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = service_quotes.request_id
        AND r.customer_id = (SELECT auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS service_messages_select ON public.service_messages;
CREATE POLICY service_messages_select ON public.service_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_quotes q
      JOIN public.service_requests r ON r.id = q.request_id
      WHERE q.id = service_messages.quote_id
        AND (
          q.provider_id = (SELECT auth.uid()::text)
          OR r.customer_id = (SELECT auth.uid()::text)
        )
    )
  );

DROP POLICY IF EXISTS service_messages_insert ON public.service_messages;
CREATE POLICY service_messages_insert ON public.service_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM public.service_quotes q
      JOIN public.service_requests r ON r.id = q.request_id
      WHERE q.id = service_messages.quote_id
        AND (
          q.provider_id = (SELECT auth.uid()::text)
          OR r.customer_id = (SELECT auth.uid()::text)
        )
    )
  );

DROP POLICY IF EXISTS service_reviews_select ON public.service_reviews;
CREATE POLICY service_reviews_select ON public.service_reviews
  FOR SELECT TO authenticated
  USING (
    customer_id = (SELECT auth.uid()::text)
    OR provider_id = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS service_reviews_insert_customer ON public.service_reviews;
CREATE POLICY service_reviews_insert_customer ON public.service_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = (SELECT auth.uid()::text)
    AND EXISTS (
      SELECT 1 FROM public.service_quotes q
      WHERE q.id = service_reviews.quote_id
        AND q.status = 'accepted'
        AND q.provider_id = service_reviews.provider_id
        AND q.request_id = service_reviews.request_id
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
CREATE POLICY avatars_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
CREATE POLICY avatars_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
CREATE POLICY avatars_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
