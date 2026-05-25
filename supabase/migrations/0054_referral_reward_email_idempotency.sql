-- Davet ödülü: aynı davet edilen e-posta için yönlendirene yalnızca bir kez puan.
-- Hesap silinince referral_rewards satırı kalır (referee_user_id NULL); tekrar kayıtta
-- (referrer_user_id, referee_email_normalized) unique ihlali → puan tekrar verilmez.

ALTER TABLE public.referral_rewards
  ADD COLUMN IF NOT EXISTS referee_email_normalized text;

UPDATE public.referral_rewards rr
SET referee_email_normalized = lower(trim(u.email))
FROM public.users u
WHERE u.id = rr.referee_user_id
  AND rr.referee_email_normalized IS NULL;

DELETE FROM public.referral_rewards
WHERE referee_email_normalized IS NULL;

ALTER TABLE public.referral_rewards
  ALTER COLUMN referee_email_normalized SET NOT NULL;

ALTER TABLE public.referral_rewards
  DROP CONSTRAINT IF EXISTS referral_rewards_referee_user_id_fkey;

ALTER TABLE public.referral_rewards
  ALTER COLUMN referee_user_id DROP NOT NULL;

ALTER TABLE public.referral_rewards
  ADD CONSTRAINT referral_rewards_referee_user_id_fkey
  FOREIGN KEY (referee_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS referral_rewards_referee_unique;

CREATE UNIQUE INDEX IF NOT EXISTS referral_rewards_referee_user_unique
  ON public.referral_rewards (referee_user_id)
  WHERE referee_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS referral_rewards_referrer_referee_email_key
  ON public.referral_rewards (referrer_user_id, referee_email_normalized);
