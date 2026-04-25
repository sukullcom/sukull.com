-- Optional contact phone for in-app display after credit-gated unlock.
-- Teachers may also use teacher_applications.teacher_phone_number as fallback
-- in application code; this column is the single place for "profile phone".
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;

COMMENT ON COLUMN "users"."phone" IS 'Optional; shared with counterparty after private-lesson message unlock or listing offer.';
