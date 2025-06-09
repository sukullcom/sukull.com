ALTER TYPE "public"."role" ADD VALUE 'student';--> statement-breakpoint
CREATE TABLE "lesson_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"meet_link" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"day_of_week" integer NOT NULL,
	"week_start_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_buddy_chats" ALTER COLUMN "participants" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "teacher_applications" ALTER COLUMN "passed" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "private_lesson_applications" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "private_lesson_applications" ADD COLUMN "status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "private_lesson_applications" ADD COLUMN "approved" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "private_lesson_applications" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_progress" ADD COLUMN "highest_streak_achieved" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "meet_link" text;--> statement-breakpoint
ALTER TABLE "lesson_bookings" ADD CONSTRAINT "lesson_bookings_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_bookings" ADD CONSTRAINT "lesson_bookings_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD CONSTRAINT "teacher_availability_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "participants_idx" ON "study_buddy_chats" USING gin ("participants");