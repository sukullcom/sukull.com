CREATE TYPE "public"."difficulty" AS ENUM('EASY', 'MEDIUM', 'HARD');--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "difficulty" "difficulty";--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "tags" text;--> statement-breakpoint
ALTER TABLE "lesson_bookings" ADD COLUMN "teacher_joined_at" timestamp;--> statement-breakpoint
ALTER TABLE "lesson_bookings" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "lesson_bookings" ADD COLUMN "earnings_amount" integer;