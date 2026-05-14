-- 0045: Tutarlılık / performans güçlendirmeleri
--
-- 1) `challenge_progress` için **(user_id, challenge_id)** UNIQUE constraint:
--    Mevcut `idx_challenge_progress_user_challenge` non-unique idi → iki paralel
--    "ilk tamamlama" submit'i iki satır + iki kez `firstPoints` ödülü üretebiliyordu.
--    Önce duplicate satırları temizliyoruz (en küçük `id` korunur), sonra
--    non-unique indeksi UNIQUE ile değiştiriyoruz. Uygulama kodu da artık
--    `INSERT ... ON CONFLICT DO NOTHING` + `RETURNING` ile yarışı handle ediyor.
--
-- 2) `teacher_reviews.offer_id` için B-tree indeks:
--    FK var (`listing_offers(id)`) ama Postgres FK kolonları otomatik indekslenmiyor.
--    "Şu teklif değerlendirilmiş mi?" lookup'ları + cascade silme tarama yapıyordu.

BEGIN;

-- 1.a — Mevcut duplicate'leri sil (en küçük id'yi koru). Üretim verisinde
-- normalde 0 satır etkilemeli; geriye dönük temizlik amacıyla.
DELETE FROM challenge_progress cp
USING challenge_progress dup
WHERE cp.user_id = dup.user_id
  AND cp.challenge_id = dup.challenge_id
  AND cp.id > dup.id;

-- 1.b — Eski non-unique indeksi düşür (UNIQUE indeks zaten arama hızı sağlar).
DROP INDEX IF EXISTS idx_challenge_progress_user_challenge;

-- 1.c — UNIQUE indeks. Constraint yerine indeks: `ON CONFLICT (user_id, challenge_id)`
-- her iki sözdiziminde de çalışır ve gelecekteki migration'larda `DROP INDEX`
-- ile geri alınabilir.
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_progress_user_challenge_uniq
  ON challenge_progress (user_id, challenge_id);

-- 2 — teacher_reviews.offer_id indeksi
CREATE INDEX IF NOT EXISTS idx_teacher_reviews_offer_id
  ON teacher_reviews (offer_id);

COMMIT;
