-- 0046: Streak bonusu idempotency
--
-- Sorun: `applyDailyStreakBonuses` `WHERE up.istikrar >= 3` ile her
-- çağrıda yeniden +bonus ekliyordu. Cron iki kez tetiklenirse
-- (Vercel retry, manuel + zamanlanmış, gece yarısı timezone overlap),
-- aynı kullanıcı **çift bonus** alır. Bu, lider tablosunu kirletir.
--
-- Çözüm: günlük tek-yazım garantisi için `last_streak_bonus_date`
-- kolonu. UPDATE artık `WHERE last_streak_bonus_date IS DISTINCT FROM
-- CURRENT_DATE` ile gate'li olur; aynı gün ikinci tetik 0 satır günceller.

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS last_streak_bonus_date DATE;

-- Performans değil, dokümantasyon amaçlı kısa indeks: gelecekteki
-- "bugün bonusu kaçanlar" rapor sorguları için.
CREATE INDEX IF NOT EXISTS idx_user_progress_last_streak_bonus_date
  ON user_progress (last_streak_bonus_date);
