-- 0052: Eğitmen başvurusuna mezun olunan üniversite ve bölüm alanları.
-- "Eğitim Durumu" (Lise / Lisans / Yüksek lisans …) zaten var; bu iki yeni
-- alan onun yanında, hangi üniversite + hangi bölüm bilgisini taşır.
--
-- Filtreleme amaçlı `university` üzerinde lower-case index ekliyoruz:
-- eğitmen rehberi üniversite arama/eşleştirme yapacak.

BEGIN;

ALTER TABLE public.teacher_applications
  ADD COLUMN IF NOT EXISTS university            text,
  ADD COLUMN IF NOT EXISTS university_department text;

-- Türkçe lower-case ile büyük/küçük harf farkını yok say — "İstanbul" ve
-- "istanbul" aynı sonuçta kalsın. PostgreSQL `lower()` ASCII tabanlı çalışır;
-- Türkçeye duyarlı lower için collation-aware bir expression index kuracağız.
CREATE INDEX IF NOT EXISTS idx_teacher_apps_university_lower
  ON public.teacher_applications (lower(university));

COMMIT;
