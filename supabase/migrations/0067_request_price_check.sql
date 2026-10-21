-- "Sadece fiyat bakıyorum" seçeneği: tarih yok, ilan bir ay açık kalır.
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_timing_chk;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_timing_chk
  CHECK (timing_type IN ('scheduled', 'two_months', 'six_months', 'price_check'));
