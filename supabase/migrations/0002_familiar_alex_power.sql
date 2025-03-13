CREATE TYPE "public"."status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'teacher', 'admin');--> statement-breakpoint
CREATE TABLE "user_daily_streak" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"achieved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "status" "status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_applications" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "role" DEFAULT 'user' NOT NULL;