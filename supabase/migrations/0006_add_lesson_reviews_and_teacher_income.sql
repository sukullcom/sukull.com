-- Migration: Add Lesson Reviews for Teacher Income Tracking
-- This migration adds the lesson reviews system for teacher ratings and income tracking

-- Create lesson_reviews table
CREATE TABLE IF NOT EXISTS "lesson_reviews" (
    "id" serial PRIMARY KEY NOT NULL,
    "booking_id" integer NOT NULL,
    "student_id" text NOT NULL,
    "teacher_id" text NOT NULL,
    "rating" integer NOT NULL,
    "comment" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "lesson_reviews" ADD CONSTRAINT "lesson_reviews_booking_id_lesson_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "lesson_bookings"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lesson_reviews" ADD CONSTRAINT "lesson_reviews_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "lesson_reviews" ADD CONSTRAINT "lesson_reviews_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "lesson_reviews_booking_id_idx" ON "lesson_reviews" ("booking_id");
CREATE INDEX IF NOT EXISTS "lesson_reviews_student_id_idx" ON "lesson_reviews" ("student_id");
CREATE INDEX IF NOT EXISTS "lesson_reviews_teacher_id_idx" ON "lesson_reviews" ("teacher_id");
CREATE INDEX IF NOT EXISTS "lesson_reviews_rating_idx" ON "lesson_reviews" ("rating");

-- Ensure only one review per booking
ALTER TABLE "lesson_reviews" ADD CONSTRAINT "unique_review_per_booking" UNIQUE ("booking_id");

-- Constraint to ensure rating is between 1 and 5
ALTER TABLE "lesson_reviews" ADD CONSTRAINT "rating_range_check" CHECK ("rating" >= 1 AND "rating" <= 5); 