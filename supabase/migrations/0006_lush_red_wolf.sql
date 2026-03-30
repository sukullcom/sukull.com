ALTER TABLE "challenge_progress" ADD COLUMN "correct_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "challenge_progress" ADD COLUMN "incorrect_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "challenge_progress" ADD COLUMN "last_attempted_at" timestamp;--> statement-breakpoint
ALTER TABLE "challenge_progress" ADD COLUMN "first_completed_at" timestamp;