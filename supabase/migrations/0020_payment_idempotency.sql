-- Payment idempotency: prevent accidental double-charges by enforcing a unique
-- (user_id, payment_id) on the payment log. The application treats the client-
-- supplied idempotencyKey as the payment_id until Iyzico assigns a real one,
-- so any retry with the same idempotencyKey is caught before Iyzico is hit.

CREATE UNIQUE INDEX IF NOT EXISTS payment_logs_user_id_payment_id_uniq
  ON payment_logs (user_id, payment_id);

-- Speeds up the idempotency lookup as well as admin investigations.
CREATE INDEX IF NOT EXISTS payment_logs_status_created_idx
  ON payment_logs (status, created_at DESC);
