-- Herkese açık raf. Şu an tek değer: kitaplar.
-- Boş bırakılan kurslar eskisi gibi başlıktan gruplanır.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS section text;
