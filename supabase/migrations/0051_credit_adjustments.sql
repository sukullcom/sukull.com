-- 0051: Admin tarafından kullanıcı kredilerine yapılan manuel ayarlamalar
-- (verme/iade/düşürme) için defter tablosu. `creditTransactions` ödeme
-- bazlı satın alımlar için ayrı kalır; bu tablo "para harici" hareketler
-- içindir.
--
-- Her satır kim (admin) ne yaptı / hangi kullanıcıya / ne sebeple / sonuç
-- bakiye nedir bilgisini tutar. Adli iz aynı zamanda `admin_audit`'a da
-- yazılır; bu tablo daha hızlı kullanıcı bazlı sorgu için ayrıca tutulur.
--
-- RLS: politikasız aktif — yalnızca sunucu Drizzle (tablo sahibi) yazabilir.

BEGIN;

CREATE TABLE IF NOT EXISTS public.credit_adjustments (
  id            bigserial PRIMARY KEY,
  user_id       text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id      text NOT NULL,
  admin_email   text,
  delta         integer NOT NULL CHECK (delta <> 0),
  reason        text NOT NULL,
  balance_after integer NOT NULL,
  created_at    timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_adjustments_user_created
  ON public.credit_adjustments (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_adjustments_admin_created
  ON public.credit_adjustments (admin_id, created_at DESC);

ALTER TABLE public.credit_adjustments ENABLE ROW LEVEL SECURITY;

COMMIT;
