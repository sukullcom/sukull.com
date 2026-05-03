-- Tamamlayıcı: 0006 tam dosya "ADD COLUMN" yüzünden tekrar çalıştırılamazsa veya
-- schools indeksleri eksik kaldıysa (0025/0006 yalnızca kısmen uygulanmış DB'ler).
-- Tümü IF NOT EXISTS — güvenle tekrar çalıştırılabilir.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 0006_add_school_location_fields.sql — indeks bölümü (sütun ekleme yok)
CREATE INDEX IF NOT EXISTS idx_schools_city ON public.schools (city);
CREATE INDEX IF NOT EXISTS idx_schools_district ON public.schools (district);
CREATE INDEX IF NOT EXISTS idx_schools_category ON public.schools (category);
CREATE INDEX IF NOT EXISTS idx_schools_kind ON public.schools (kind);
CREATE INDEX IF NOT EXISTS idx_schools_location_search ON public.schools (city, district);
CREATE INDEX IF NOT EXISTS idx_schools_name_search ON public.schools USING gin (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_schools_name_ilike ON public.schools (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_schools_total_points ON public.schools (total_points DESC);

-- 0025_add_admin_search_and_leaderboard_indexes.sql — yalnızca schools bölümü
CREATE INDEX IF NOT EXISTS "idx_schools_type_points"
  ON public.schools ("type", "total_points" DESC);
CREATE INDEX IF NOT EXISTS "idx_schools_type_city_points"
  ON public.schools ("type", "city", "total_points" DESC);
CREATE INDEX IF NOT EXISTS "idx_schools_name_trgm"
  ON public.schools USING gin ("name" gin_trgm_ops);
