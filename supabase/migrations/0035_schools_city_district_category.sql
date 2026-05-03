-- Okul seçimi (/api/schools action=schools): WHERE city AND district AND category
-- + isteğe bağlı ILIKE name. Mevcut (city,district) ve ayrı sütun indekslerine ek olarak
-- eşitlik üçlüsü için tek btree — planlayıcı tek indeks taramasına yaklaşır.
CREATE INDEX IF NOT EXISTS idx_schools_city_district_category
  ON public.schools (city, district, category);
