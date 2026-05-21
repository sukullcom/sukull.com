-- 0049: Ders tamamlama bonusu için idempotency tablosu
--
-- Sorun: `awardLessonCompletionBonus` istemci `wrongCount`'a güvenip her
-- çağrıda LESSON_COMPLETION_BONUS (+5) + PERFECT_LESSON_BONUS (+15) yazıyordu.
-- DevTools'tan döngü ile yazılabilir, idempotency yoktu.
--
-- Çözüm: (user_id, lesson_id) UNIQUE bir kayıt tablosu. Server INSERT ...
-- ON CONFLICT DO NOTHING RETURNING ile gate eder; 0 satır → bonus zaten
-- verilmiş, yeniden ödeme yok. `wrong_count` sunucuda `challenge_progress`
-- üzerinden hesaplanır; istemci sayısı tamamen yok sayılır.

BEGIN;

CREATE TABLE IF NOT EXISTS public.lesson_completion_bonuses (
  id            bigserial PRIMARY KEY,
  user_id       text   NOT NULL,
  lesson_id     integer NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  wrong_count   integer NOT NULL DEFAULT 0,
  completion_bonus integer NOT NULL DEFAULT 0,
  perfect_bonus    integer NOT NULL DEFAULT 0,
  total_awarded    integer NOT NULL DEFAULT 0,
  awarded_at    timestamp NOT NULL DEFAULT NOW()
);

-- (user_id, lesson_id) UNIQUE: bonus yalnızca bir kez verilebilir.
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_completion_bonuses_user_lesson
  ON public.lesson_completion_bonuses (user_id, lesson_id);

-- Kullanıcı bazlı liste / analitik için.
CREATE INDEX IF NOT EXISTS idx_lesson_completion_bonuses_user_id
  ON public.lesson_completion_bonuses (user_id);

-- RLS: yalnızca sahip okur. Yazma server tarafında (table owner) yapılır;
-- politika yok = anon/authenticated INSERT/UPDATE/DELETE yasak.
ALTER TABLE public.lesson_completion_bonuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_completion_bonuses_select_own ON public.lesson_completion_bonuses;
CREATE POLICY lesson_completion_bonuses_select_own ON public.lesson_completion_bonuses
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

COMMIT;
