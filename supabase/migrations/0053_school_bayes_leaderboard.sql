-- 0053: Okul liderlik tablosu için adil skor metriği.
--
-- Şu ana kadarki yöntem `schools.total_points = SUM(user_progress.points)`
-- üzerinden direkt toplamdı; büyük okulları otomatik öne çıkarıyordu —
-- 10.000 öğrencili lise, 200 öğrencili bir okuldan sayısal üstünlükle
-- üstte kalıyordu, aktiflik fark etmiyordu.
--
-- Yeni model: **Bayesian shrinkage ile düzeltilmiş ortalama puan**.
--   bayes_score = (raw_avg × active_count + prior_mean × prior_strength)
--               / (active_count + prior_strength)
--
-- Burada:
--   • raw_avg            : okuldaki aktif öğrencilerin ortalama puanı.
--   • active_count       : son 30 günde puan üreten öğrenci sayısı.
--   • prior_mean         : aynı okul tipindeki (üniversite/lise/ortaokul/
--                          ilkokul) ve eşiği geçen okulların raw_avg
--                          değerlerinin **medyanı** — outlier'a dayanıklı.
--   • prior_strength     : kaç "hayalî" prior_mean öğrencisi eklenir.
--                          10 (eşikle simetrik); az öğrencili okul prior'a
--                          yarı yarıya çekilir, kalabalık okul kendi
--                          ortalaması ile domine eder.
--
-- Listede yer almak için: active_count >= 10.
-- Sıralama: bayes_score DESC, active_count DESC, name ASC.
--
-- total_points sütununu **silmiyoruz**; ikinci satırda görsel ve admin
-- gözlemi için kalıyor. Ayrıca rollback maliyeti sıfır kalır.

BEGIN;

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS active_student_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS raw_avg_points       NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_avg_score        NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Liderlik sıralama indeksi: liste sorgusu `WHERE type = ? AND
-- active_student_count >= 10 ORDER BY top_avg_score DESC` formundadır.
-- Partial index ile sadece eşiği geçenler — tablo şişmesin.
CREATE INDEX IF NOT EXISTS idx_schools_leaderboard_score
  ON public.schools (type, top_avg_score DESC, active_student_count DESC)
  WHERE active_student_count >= 10;

-- İlk deploy backfill: cron'u beklemeden yeni kolonları hesapla.
-- Cron her gece aynı CTE'yi koşturacak — bu ilk koşuş eş anlamlı bir
-- "manual primer" iş görür ki migration uygulanır uygulanmaz liderlik
-- tablosu gerçek verisini gösterir.
WITH
  active_users AS (
    SELECT DISTINCT al.user_id
    FROM activity_log al
    WHERE al.created_at >= NOW() - INTERVAL '30 days'
      AND al.event_type IN ('lesson_complete', 'game_end')
  ),
  school_total AS (
    SELECT up.school_id, COALESCE(SUM(up.points)::int, 0) AS total_points
    FROM user_progress up
    WHERE up.school_id IS NOT NULL
    GROUP BY up.school_id
  ),
  school_active AS (
    SELECT up.school_id, up.user_id, up.points
    FROM user_progress up
    INNER JOIN active_users au ON au.user_id = up.user_id
    WHERE up.school_id IS NOT NULL
  ),
  school_agg AS (
    SELECT
      s.id AS school_id,
      s.type AS school_type,
      COALESCE(st.total_points, 0)                   AS total_points,
      COUNT(sa.user_id)::int                          AS active_count,
      COALESCE(AVG(sa.points)::numeric(12,2), 0)      AS raw_avg
    FROM public.schools s
    LEFT JOIN school_total  st ON st.school_id = s.id
    LEFT JOIN school_active sa ON sa.school_id = s.id
    GROUP BY s.id, s.type, st.total_points
  ),
  type_prior AS (
    SELECT
      school_type,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY raw_avg) AS prior_mean
    FROM school_agg
    WHERE active_count >= 10
    GROUP BY school_type
  ),
  school_score AS (
    SELECT
      sa.school_id,
      sa.total_points,
      sa.active_count,
      sa.raw_avg,
      CASE
        WHEN sa.active_count = 0 THEN 0
        WHEN tp.prior_mean IS NULL THEN sa.raw_avg
        ELSE (sa.raw_avg * sa.active_count + tp.prior_mean * 10)
             / (sa.active_count + 10)
      END::numeric(12,2) AS bayes_score
    FROM school_agg sa
    LEFT JOIN type_prior tp ON tp.school_type = sa.school_type
  )
UPDATE public.schools s
SET
  total_points         = ss.total_points,
  active_student_count = ss.active_count,
  raw_avg_points       = ss.raw_avg,
  top_avg_score        = ss.bayes_score
FROM school_score ss
WHERE s.id = ss.school_id;

COMMIT;
