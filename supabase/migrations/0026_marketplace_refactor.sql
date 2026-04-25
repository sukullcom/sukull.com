-- 0026_marketplace_refactor.sql
--
-- Replace the booking / availability / review model with a marketplace:
--   - Students create `listings` (talep ilanları).
--   - Teachers spend credits to submit bids via `listing_offers`
--     (max 4 pending offers per listing, enforced by trigger below).
--   - Students spend credits to open a conversation with a teacher
--     (`message_unlocks`, unique per student+teacher pair; one-time fee,
--     thread then stays open forever).
--   - `credit_usage` is a write-only log per credit spend, so we can
--     audit / report / refund without juggling multiple balances.
--
-- Old tables (lesson_bookings, lesson_reviews, teacher_availability,
-- private_lesson_applications) and the legacy `users.meet_link` column
-- are dropped. See conversation history: full_delete decision.

-- 1) Drop legacy booking / availability / review / student-application
--    surface. Cascade also nukes foreign key dependents.
DROP TABLE IF EXISTS "lesson_reviews" CASCADE;
DROP TABLE IF EXISTS "lesson_bookings" CASCADE;
DROP TABLE IF EXISTS "teacher_availability" CASCADE;
DROP TABLE IF EXISTS "private_lesson_applications" CASCADE;

-- meet_link column is no longer used anywhere (we're out of the
-- in-platform-meeting business).
ALTER TABLE "users" DROP COLUMN IF EXISTS "meet_link";

-- 2) Extend teacher_applications with structured rate / location fields.
--    The legacy free-text `hourly_rate` column is kept for back-compat
--    (old rows still carry a combined rate), new applications populate
--    the numeric split fields below.
ALTER TABLE "teacher_applications"
  ADD COLUMN IF NOT EXISTS "hourly_rate_online"     integer,
  ADD COLUMN IF NOT EXISTS "hourly_rate_in_person"  integer,
  ADD COLUMN IF NOT EXISTS "city"                   text,
  ADD COLUMN IF NOT EXISTS "district"               text;

-- 3) Listings (öğrenci ilanları).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE "listing_status" AS ENUM ('open', 'closed', 'expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_lesson_mode') THEN
    CREATE TYPE "listing_lesson_mode" AS ENUM ('online', 'in_person', 'both');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "listings" (
  "id"              serial PRIMARY KEY,
  "student_id"      text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "subject"         text NOT NULL,
  "grade"           text,
  "title"           text NOT NULL,
  "description"     text NOT NULL,
  "lesson_mode"     "listing_lesson_mode" NOT NULL DEFAULT 'online',
  "city"            text,
  "district"        text,
  "budget_min"      integer,
  "budget_max"      integer,
  "preferred_hours" text,
  "status"          "listing_status" NOT NULL DEFAULT 'open',
  "offer_count"     integer NOT NULL DEFAULT 0,
  "expires_at"      timestamp,
  "created_at"      timestamp NOT NULL DEFAULT now(),
  "updated_at"      timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_listings_student"
  ON "listings" ("student_id");
CREATE INDEX IF NOT EXISTS "idx_listings_status_created"
  ON "listings" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_listings_subject_status"
  ON "listings" ("subject", "status");

-- 4) Listing offers. UNIQUE(listing, teacher) prevents a teacher from
--    double-bidding on the same listing. The 4-offer cap is enforced by
--    a BEFORE INSERT trigger below, so we can guarantee the limit even
--    if a buggy caller skips the action-layer check.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
    CREATE TYPE "offer_status" AS ENUM ('pending', 'withdrawn', 'accepted', 'rejected');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "listing_offers" (
  "id"               serial PRIMARY KEY,
  "listing_id"       integer NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "teacher_id"       text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "price_proposal"   integer NOT NULL,
  "note"             text,
  "status"           "offer_status" NOT NULL DEFAULT 'pending',
  "created_at"       timestamp NOT NULL DEFAULT now(),
  "updated_at"       timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_listing_offers_listing_teacher"
  ON "listing_offers" ("listing_id", "teacher_id");
CREATE INDEX IF NOT EXISTS "idx_listing_offers_teacher"
  ON "listing_offers" ("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_listing_offers_listing_status"
  ON "listing_offers" ("listing_id", "status");

-- Max-4 pending offers per listing. Also keeps the denormalized
-- `listings.offer_count` in sync so UI can render "3 / 4" without
-- a COUNT roundtrip.
CREATE OR REPLACE FUNCTION "enforce_offer_cap"() RETURNS trigger AS $$
DECLARE
  active_count integer;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'pending' AND OLD.status <> 'pending') THEN
    SELECT COUNT(*) INTO active_count
      FROM "listing_offers"
      WHERE "listing_id" = NEW."listing_id"
        AND "status" = 'pending'
        AND "id" <> COALESCE(NEW."id", -1);
    IF active_count >= 4 THEN
      RAISE EXCEPTION 'LISTING_OFFER_CAP_REACHED'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_listing_offers_cap" ON "listing_offers";
CREATE TRIGGER "trg_listing_offers_cap"
  BEFORE INSERT OR UPDATE OF "status"
  ON "listing_offers"
  FOR EACH ROW
  EXECUTE FUNCTION "enforce_offer_cap"();

CREATE OR REPLACE FUNCTION "sync_listing_offer_count"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "listings"
      SET "offer_count" = "offer_count" + 1,
          "updated_at" = now()
      WHERE "id" = NEW."listing_id" AND NEW.status = 'pending';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "listings"
      SET "offer_count" = GREATEST(0, "offer_count" - 1),
          "updated_at" = now()
      WHERE "id" = OLD."listing_id" AND OLD.status = 'pending';
  ELSIF TG_OP = 'UPDATE' THEN
    -- pending -> non-pending  ==> decrement
    IF OLD.status = 'pending' AND NEW.status <> 'pending' THEN
      UPDATE "listings"
        SET "offer_count" = GREATEST(0, "offer_count" - 1),
            "updated_at" = now()
        WHERE "id" = NEW."listing_id";
    -- non-pending -> pending  ==> increment
    ELSIF OLD.status <> 'pending' AND NEW.status = 'pending' THEN
      UPDATE "listings"
        SET "offer_count" = "offer_count" + 1,
            "updated_at" = now()
        WHERE "id" = NEW."listing_id";
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_listing_offers_count" ON "listing_offers";
CREATE TRIGGER "trg_listing_offers_count"
  AFTER INSERT OR UPDATE OF "status" OR DELETE
  ON "listing_offers"
  FOR EACH ROW
  EXECUTE FUNCTION "sync_listing_offer_count"();

-- 5) Message unlocks — one-time credit charge per (student, teacher)
--    pair. chat_id optionally points at a studyBuddyChats row.
CREATE TABLE IF NOT EXISTS "message_unlocks" (
  "id"         serial PRIMARY KEY,
  "student_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "teacher_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "chat_id"    integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_message_unlocks_pair"
  ON "message_unlocks" ("student_id", "teacher_id");
CREATE INDEX IF NOT EXISTS "idx_message_unlocks_teacher"
  ON "message_unlocks" ("teacher_id");

-- 6) Credit-usage log — every deduction from userCredits is mirrored here.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_usage_reason') THEN
    CREATE TYPE "credit_usage_reason" AS ENUM ('message_unlock', 'listing_offer');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "credit_usage" (
  "id"          serial PRIMARY KEY,
  "user_id"     text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reason"      "credit_usage_reason" NOT NULL,
  "credits_used" integer NOT NULL DEFAULT 1,
  "ref_type"    text,
  "ref_id"      text,
  "created_at"  timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_credit_usage_user_created"
  ON "credit_usage" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_credit_usage_reason"
  ON "credit_usage" ("reason", "created_at");
