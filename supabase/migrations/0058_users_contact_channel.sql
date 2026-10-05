-- Preferred private-lesson contact channel. Phone stays optional when email is chosen.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contact_channel" text;

COMMENT ON COLUMN "users"."contact_channel" IS 'Private-lesson contact preference: phone or email. Null means unset (legacy).';
