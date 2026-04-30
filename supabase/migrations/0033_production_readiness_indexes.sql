-- 0033: Ek üretim indeksleri (inceleme özeti — isTeacher, teacher-leave, abonelik süresi)
-- Çoğu admin arama / ilan indeksi 0025 ve 0026'da zaten vardı.

CREATE INDEX IF NOT EXISTS "idx_teacher_apps_user_status"
  ON "teacher_applications" ("user_id", "status");

CREATE INDEX IF NOT EXISTS "idx_listing_offers_teacher_status"
  ON "listing_offers" ("teacher_id", "status");

CREATE INDEX IF NOT EXISTS "idx_subscriptions_status_end_date"
  ON "user_subscriptions" ("status", "end_date");
