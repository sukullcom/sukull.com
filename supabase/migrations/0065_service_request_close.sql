-- Müşteri ilanını kendisi kapatabilir ('closed'). Hizmet veren akışı için sıralamaya uygun indeks.
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_status_chk;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_status_chk
  CHECK (status IN ('pending', 'open', 'accepted', 'expired', 'rejected', 'closed'));

CREATE INDEX IF NOT EXISTS idx_service_requests_open_recent
  ON public.service_requests (service_slug, created_at DESC)
  WHERE status = 'open';
