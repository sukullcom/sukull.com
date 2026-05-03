-- 0041: Supabase Data API için kalan tablolar — RLS (0040 + 0038 ile birlikte).
-- Drizzle / tablo sahibi bağlantısı RLS'yi atlamaya devam eder.

-- =============================================================================
-- activity_log_daily — toplu analitik; PostgREST’ten erişim yok
-- =============================================================================

ALTER TABLE public.activity_log_daily ENABLE ROW LEVEL SECURITY;

-- Politika yok: authenticated / anon için SELECT/WRITE yasak

-- =============================================================================
-- Kredi tabloları — yalnızca kendi user_id
-- =============================================================================

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_credits_select_own ON public.user_credits;
DROP POLICY IF EXISTS user_credits_insert_own ON public.user_credits;
DROP POLICY IF EXISTS user_credits_update_own ON public.user_credits;

CREATE POLICY user_credits_select_own ON public.user_credits
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_credits_insert_own ON public.user_credits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_credits_update_own ON public.user_credits
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS credit_usage_select_own ON public.credit_usage;
DROP POLICY IF EXISTS credit_usage_insert_own ON public.credit_usage;
DROP POLICY IF EXISTS credit_usage_update_own ON public.credit_usage;

CREATE POLICY credit_usage_select_own ON public.credit_usage
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY credit_usage_insert_own ON public.credit_usage
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY credit_usage_update_own ON public.credit_usage
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS credit_transactions_select_own ON public.credit_transactions;
DROP POLICY IF EXISTS credit_transactions_insert_own ON public.credit_transactions;
DROP POLICY IF EXISTS credit_transactions_update_own ON public.credit_transactions;

CREATE POLICY credit_transactions_select_own ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY credit_transactions_insert_own ON public.credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY credit_transactions_update_own ON public.credit_transactions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

-- =============================================================================
-- Marketplace — ilanlar (açık ilanlar tüm giriş yapmış kullanıcılara okunur)
-- =============================================================================

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS listings_select_own_or_open ON public.listings;
DROP POLICY IF EXISTS listings_insert_own ON public.listings;
DROP POLICY IF EXISTS listings_update_own ON public.listings;

CREATE POLICY listings_select_own_or_open ON public.listings
  FOR SELECT TO authenticated
  USING (
    student_id = (SELECT auth.uid()::text)
    OR status = 'open'::listing_status
  );

CREATE POLICY listings_insert_own ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()::text));

CREATE POLICY listings_update_own ON public.listings
  FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()::text))
  WITH CHECK (student_id = (SELECT auth.uid()::text));

ALTER TABLE public.listing_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS listing_offers_select_parties ON public.listing_offers;
DROP POLICY IF EXISTS listing_offers_insert_teacher ON public.listing_offers;
DROP POLICY IF EXISTS listing_offers_update_parties ON public.listing_offers;
DROP POLICY IF EXISTS listing_offers_update_teacher ON public.listing_offers;
DROP POLICY IF EXISTS listing_offers_delete_teacher ON public.listing_offers;

CREATE POLICY listing_offers_select_parties ON public.listing_offers
  FOR SELECT TO authenticated
  USING (
    teacher_id = (SELECT auth.uid()::text)
    OR EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = listing_offers.listing_id
        AND l.student_id = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY listing_offers_insert_teacher ON public.listing_offers
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = (SELECT auth.uid()::text));

CREATE POLICY listing_offers_update_teacher ON public.listing_offers
  FOR UPDATE TO authenticated
  USING (teacher_id = (SELECT auth.uid()::text))
  WITH CHECK (teacher_id = (SELECT auth.uid()::text));

CREATE POLICY listing_offers_delete_teacher ON public.listing_offers
  FOR DELETE TO authenticated
  USING (teacher_id = (SELECT auth.uid()::text));

-- =============================================================================
-- message_unlocks — öğrenci veya öğretmen satırı görebilir
-- =============================================================================

ALTER TABLE public.message_unlocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS message_unlocks_select_pair ON public.message_unlocks;
DROP POLICY IF EXISTS message_unlocks_insert_participant ON public.message_unlocks;
DROP POLICY IF EXISTS message_unlocks_update_participant ON public.message_unlocks;

CREATE POLICY message_unlocks_select_pair ON public.message_unlocks
  FOR SELECT TO authenticated
  USING (
    student_id = (SELECT auth.uid()::text)
    OR teacher_id = (SELECT auth.uid()::text)
  );

CREATE POLICY message_unlocks_insert_participant ON public.message_unlocks
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (SELECT auth.uid()::text)
    OR teacher_id = (SELECT auth.uid()::text)
  );

CREATE POLICY message_unlocks_update_participant ON public.message_unlocks
  FOR UPDATE TO authenticated
  USING (
    student_id = (SELECT auth.uid()::text)
    OR teacher_id = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    student_id = (SELECT auth.uid()::text)
    OR teacher_id = (SELECT auth.uid()::text)
  );

-- =============================================================================
-- teacher_reviews — değerlendiren veya değerlendirilen
-- =============================================================================

ALTER TABLE public.teacher_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS teacher_reviews_select_parties ON public.teacher_reviews;
DROP POLICY IF EXISTS teacher_reviews_insert_student ON public.teacher_reviews;
DROP POLICY IF EXISTS teacher_reviews_update_student ON public.teacher_reviews;
DROP POLICY IF EXISTS teacher_reviews_delete_student ON public.teacher_reviews;

CREATE POLICY teacher_reviews_select_parties ON public.teacher_reviews
  FOR SELECT TO authenticated
  USING (
    student_id = (SELECT auth.uid()::text)
    OR teacher_id = (SELECT auth.uid()::text)
  );

CREATE POLICY teacher_reviews_insert_student ON public.teacher_reviews
  FOR INSERT TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()::text));

CREATE POLICY teacher_reviews_update_student ON public.teacher_reviews
  FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()::text))
  WITH CHECK (student_id = (SELECT auth.uid()::text));

CREATE POLICY teacher_reviews_delete_student ON public.teacher_reviews
  FOR DELETE TO authenticated
  USING (student_id = (SELECT auth.uid()::text));

-- =============================================================================
-- snippets — paylaşılan kütüphane: herkes okur; yazma yalnızca sahip
-- (SECURITY_REVIEW_CHECKLIST.md ile uyumlu)
-- =============================================================================

ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS snippets_select_authenticated ON public.snippets;
DROP POLICY IF EXISTS snippets_insert_own ON public.snippets;
DROP POLICY IF EXISTS snippets_update_own ON public.snippets;
DROP POLICY IF EXISTS snippets_delete_own ON public.snippets;

CREATE POLICY snippets_select_authenticated ON public.snippets
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY snippets_insert_own ON public.snippets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY snippets_update_own ON public.snippets
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY snippets_delete_own ON public.snippets
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- =============================================================================
-- user_daily_streak
-- =============================================================================

ALTER TABLE public.user_daily_streak ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_daily_streak_select_own ON public.user_daily_streak;
DROP POLICY IF EXISTS user_daily_streak_insert_own ON public.user_daily_streak;
DROP POLICY IF EXISTS user_daily_streak_update_own ON public.user_daily_streak;
DROP POLICY IF EXISTS user_daily_streak_delete_own ON public.user_daily_streak;

CREATE POLICY user_daily_streak_select_own ON public.user_daily_streak
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_daily_streak_insert_own ON public.user_daily_streak
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_daily_streak_update_own ON public.user_daily_streak
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_daily_streak_delete_own ON public.user_daily_streak
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()::text));
