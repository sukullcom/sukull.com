-- İlanda görünmez. Yalnızca teklif veren, sohbette seçilen kanalı görür.
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS contact_channel text;

ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_contact_chk;

ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_contact_chk
  CHECK (contact_channel IS NULL OR contact_channel IN ('phone', 'email'));
