-- Davet (referral): benzersiz kod + yönlendiren kullanıcı + tek seferlik ödül kaydı.
-- Drizzle (postgres rolü) RLS'yi atlar; tablo yalnızca sunucu tarafından yazılır.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by_user_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_referred_by_user_id_users_id_fk'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_referred_by_user_id_users_id_fk
      FOREIGN KEY (referred_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE public.users u
SET referral_code = 'SK' || upper(substr(md5(u.id::text), 1, 8))
WHERE referral_code IS NULL;

ALTER TABLE public.users ALTER COLUMN referral_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_key ON public.users(referral_code);

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id bigserial PRIMARY KEY,
  referrer_user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referee_user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referrer_points integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_rewards_referee_unique UNIQUE (referee_user_id)
);

CREATE INDEX IF NOT EXISTS referral_rewards_referrer_idx
  ON public.referral_rewards(referrer_user_id);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
