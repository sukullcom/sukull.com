-- payment-server 3DS initialize uses idempotency on (user_id, payment_id).
-- If migration 0020 never ran on this database, ON CONFLICT (user_id, payment_id)
-- fails with PostgreSQL 42P10. This file is safe to apply twice (IF NOT EXISTS).
--
-- If this errors with "could not create unique index" / duplicate key, dedupe
-- payment_logs rows for the same (user_id, payment_id) first, then re-run.

CREATE UNIQUE INDEX IF NOT EXISTS payment_logs_user_id_payment_id_uniq
  ON public.payment_logs (user_id, payment_id);
