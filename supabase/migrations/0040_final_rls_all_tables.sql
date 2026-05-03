-- 0040: Kalan RLS — eğitim içeriği (salt okunur), kullanıcı ilerlemesi, başvuru/abonelik,
-- log tabloları (PostgREST’ten tamamen kapalı). Sunucu Drizzle (tablo sahibi) RLS’yi atlar.
--
-- Not: Bu repoda `user_achievements` tablosu yok; aşağıda yalnızca tablo mevcutsa çalışan blok vardır.

-- =============================================================================
-- Eğitim içeriği: herkes (authenticated) okuyabilir; INSERT/UPDATE/DELETE politikası yok = yasak
-- =============================================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS courses_select_authenticated ON public.courses;
CREATE POLICY courses_select_authenticated ON public.courses
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS units_select_authenticated ON public.units;
CREATE POLICY units_select_authenticated ON public.units
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lessons_select_authenticated ON public.lessons;
CREATE POLICY lessons_select_authenticated ON public.lessons
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS challenges_select_authenticated ON public.challenges;
CREATE POLICY challenges_select_authenticated ON public.challenges
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE public.challenge_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS challenge_options_select_authenticated ON public.challenge_options;
CREATE POLICY challenge_options_select_authenticated ON public.challenge_options
  FOR SELECT TO authenticated
  USING (true);

-- =============================================================================
-- Kullanıcı ilerlemesi ve günlük görevler (yalnızca sahip)
-- =============================================================================

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_progress_select_own ON public.user_progress;
DROP POLICY IF EXISTS user_progress_insert_own ON public.user_progress;
DROP POLICY IF EXISTS user_progress_update_own ON public.user_progress;

CREATE POLICY user_progress_select_own ON public.user_progress
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_progress_insert_own ON public.user_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_progress_update_own ON public.user_progress
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS challenge_progress_select_own ON public.challenge_progress;
DROP POLICY IF EXISTS challenge_progress_insert_own ON public.challenge_progress;
DROP POLICY IF EXISTS challenge_progress_update_own ON public.challenge_progress;

CREATE POLICY challenge_progress_select_own ON public.challenge_progress
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY challenge_progress_insert_own ON public.challenge_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY challenge_progress_update_own ON public.challenge_progress
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_daily_challenges_select_own ON public.user_daily_challenges;
DROP POLICY IF EXISTS user_daily_challenges_insert_own ON public.user_daily_challenges;
DROP POLICY IF EXISTS user_daily_challenges_update_own ON public.user_daily_challenges;

CREATE POLICY user_daily_challenges_select_own ON public.user_daily_challenges
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_daily_challenges_insert_own ON public.user_daily_challenges
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_daily_challenges_update_own ON public.user_daily_challenges
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

-- Opsiyonel tablo (şu anki Drizzle şemasında yok; ileride eklenirse otomatik korunur)
DO $body$
BEGIN
  IF to_regclass('public.user_achievements') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS user_achievements_select_own ON public.user_achievements';
    EXECUTE 'DROP POLICY IF EXISTS user_achievements_insert_own ON public.user_achievements';
    EXECUTE 'DROP POLICY IF EXISTS user_achievements_update_own ON public.user_achievements';
    EXECUTE $p$
      CREATE POLICY user_achievements_select_own ON public.user_achievements
        FOR SELECT TO authenticated
        USING (user_id = (SELECT auth.uid()::text))
    $p$;
    EXECUTE $p$
      CREATE POLICY user_achievements_insert_own ON public.user_achievements
        FOR INSERT TO authenticated
        WITH CHECK (user_id = (SELECT auth.uid()::text))
    $p$;
    EXECUTE $p$
      CREATE POLICY user_achievements_update_own ON public.user_achievements
        FOR UPDATE TO authenticated
        USING (user_id = (SELECT auth.uid()::text))
        WITH CHECK (user_id = (SELECT auth.uid()::text))
    $p$;
  END IF;
END $body$;

-- =============================================================================
-- Öğretmen başvurusu, alanlar, abonelik (yalnızca sahip — teacher_fields: teacher_id)
-- =============================================================================

ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS teacher_applications_select_own ON public.teacher_applications;
DROP POLICY IF EXISTS teacher_applications_insert_own ON public.teacher_applications;
DROP POLICY IF EXISTS teacher_applications_update_own ON public.teacher_applications;

CREATE POLICY teacher_applications_select_own ON public.teacher_applications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY teacher_applications_insert_own ON public.teacher_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY teacher_applications_update_own ON public.teacher_applications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

ALTER TABLE public.teacher_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS teacher_fields_select_own ON public.teacher_fields;
DROP POLICY IF EXISTS teacher_fields_insert_own ON public.teacher_fields;
DROP POLICY IF EXISTS teacher_fields_update_own ON public.teacher_fields;
DROP POLICY IF EXISTS teacher_fields_delete_own ON public.teacher_fields;

CREATE POLICY teacher_fields_select_own ON public.teacher_fields
  FOR SELECT TO authenticated
  USING (teacher_id = (SELECT auth.uid()::text));

CREATE POLICY teacher_fields_insert_own ON public.teacher_fields
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = (SELECT auth.uid()::text));

CREATE POLICY teacher_fields_update_own ON public.teacher_fields
  FOR UPDATE TO authenticated
  USING (teacher_id = (SELECT auth.uid()::text))
  WITH CHECK (teacher_id = (SELECT auth.uid()::text));

CREATE POLICY teacher_fields_delete_own ON public.teacher_fields
  FOR DELETE TO authenticated
  USING (teacher_id = (SELECT auth.uid()::text));

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_subscriptions_select_own ON public.user_subscriptions;
DROP POLICY IF EXISTS user_subscriptions_insert_own ON public.user_subscriptions;
DROP POLICY IF EXISTS user_subscriptions_update_own ON public.user_subscriptions;

CREATE POLICY user_subscriptions_select_own ON public.user_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_subscriptions_insert_own ON public.user_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY user_subscriptions_update_own ON public.user_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

-- =============================================================================
-- Log / denetim: RLS açık, politikası yok → anon & authenticated için SELECT/WRITE yasak
-- (yalnızca tablo sahibi / service role / Drizzle yolu)
-- =============================================================================

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
