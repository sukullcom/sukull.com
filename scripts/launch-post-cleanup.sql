-- Canlı açılış sonrası / test kullanıcı temizliği ardından çalıştırın.
-- Idempotent; güvenle tekrarlanabilir.
--
--   npm run launch:post-cleanup
--
-- ÖNEMLİ: payment_logs silme bölümü yorumda — sadece TÜM ödemeler sandbox/test ise açın.

-- 1) Okul puanlarını user_progress ile hizala
UPDATE public.schools s
SET total_points = COALESCE((
  SELECT SUM(up.points)::int
  FROM public.user_progress up
  WHERE up.school_id = s.id
), 0);

-- 2) Yetim kayıt raporu (silme yapmaz)
DO $$
DECLARE
  auth_orphan int;
  public_orphan int;
BEGIN
  SELECT COUNT(*)::int INTO auth_orphan
  FROM auth.users au
  LEFT JOIN public.users pu ON pu.id = au.id::text
  WHERE pu.id IS NULL;

  SELECT COUNT(*)::int INTO public_orphan
  FROM public.users pu
  LEFT JOIN auth.users au ON au.id::text = pu.id
  WHERE au.id IS NULL;

  RAISE NOTICE 'Yetim auth.users (profil yok): %', auth_orphan;
  RAISE NOTICE 'Yetim public.users (auth yok): %', public_orphan;
END $$;

-- 3) İsteğe bağlı: sandbox test ödeme kayıtları (GERÇEK ÖDEME VARSA AÇMAYIN)
-- DELETE FROM public.credit_transactions;
-- DELETE FROM public.payment_logs;
-- UPDATE public.user_credits SET total_credits = 0, used_credits = 0, available_credits = 0;

-- 4) Eski rate-limit pencereleri (tablo + fonksiyon ikisi de varsa)
-- Bazı ortamlarda fonksiyon var ama 0019 migration uygulanmamış olabilir → atla.
DO $$
DECLARE
  v_deleted int;
BEGIN
  IF to_regclass('public.rate_limits') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = 'cleanup_rate_limits'
     ) THEN
    SELECT cleanup_rate_limits() INTO v_deleted;
    RAISE NOTICE 'rate_limits temizlendi: % satır', v_deleted;
  ELSE
    RAISE NOTICE 'rate_limits atlandı (tablo yok). İsterseniz: npm run db:apply -- supabase/migrations/0019_add_rate_limits.sql';
  END IF;
END $$;
