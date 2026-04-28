-- Üst üste hatasız soru (ilk denemede doğru) takibi — rozetler için max seri.
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS current_answer_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_answer_streak integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN user_progress.current_answer_streak IS 'Son yanlıştan bu yana ardışık ilk denemede doğru sayısı (ders içi)';
COMMENT ON COLUMN user_progress.max_answer_streak IS 'Tüm zamanların en uzun hatasız serisi';
