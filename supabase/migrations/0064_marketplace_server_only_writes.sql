-- Hizmet pazarına bütün yazmalar sunucu aksiyonlarından (doğrudan veritabanı bağlantısı) yapılır.
-- İstemci anahtarıyla REST üzerinden yazma; kabul edilmiş teklif eklemeye, başkasının teklifine yorum
-- yazmaya, teklif fiyatını değiştirmeye ve istek sınırlarını atlamaya izin veriyordu. Okuma kuralları kalır.

DROP POLICY IF EXISTS service_requests_insert_own ON public.service_requests;
DROP POLICY IF EXISTS service_requests_update_own ON public.service_requests;
DROP POLICY IF EXISTS service_quotes_insert_own ON public.service_quotes;
DROP POLICY IF EXISTS service_quotes_update_customer ON public.service_quotes;
DROP POLICY IF EXISTS service_messages_insert ON public.service_messages;
DROP POLICY IF EXISTS service_reviews_insert_customer ON public.service_reviews;

DROP POLICY IF EXISTS marketplace_profiles_own ON public.marketplace_profiles;
CREATE POLICY marketplace_profiles_select_own ON public.marketplace_profiles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS provider_services_own ON public.provider_services;
CREATE POLICY provider_services_select_own ON public.provider_services
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.marketplace_profiles,
  public.provider_services,
  public.service_requests,
  public.service_quotes,
  public.service_messages,
  public.service_reviews
FROM anon, authenticated;
