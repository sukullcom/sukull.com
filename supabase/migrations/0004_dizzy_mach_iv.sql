ALTER TYPE "public"."type" ADD VALUE 'DRAG_DROP';--> statement-breakpoint
ALTER TYPE "public"."type" ADD VALUE 'FILL_BLANK';--> statement-breakpoint
ALTER TYPE "public"."type" ADD VALUE 'MATCH_PAIRS';--> statement-breakpoint
ALTER TYPE "public"."type" ADD VALUE 'SEQUENCE';--> statement-breakpoint
ALTER TYPE "public"."type" ADD VALUE 'TIMER_CHALLENGE';--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"payment_id" text NOT NULL,
	"credits_amount" integer NOT NULL,
	"total_price" text NOT NULL,
	"currency" text DEFAULT 'TRY' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"student_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"payment_id" text NOT NULL,
	"request_data" jsonb NOT NULL,
	"response_data" jsonb NOT NULL,
	"status" text NOT NULL,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"subject" text NOT NULL,
	"grade" text NOT NULL,
	"display_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total_credits" integer DEFAULT 0 NOT NULL,
	"used_credits" integer DEFAULT 0 NOT NULL,
	"available_credits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subscription_type" text DEFAULT 'infinite_hearts' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"payment_id" text,
	"amount" text DEFAULT '100' NOT NULL,
	"currency" text DEFAULT 'TRY' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenge_options" ADD COLUMN "correct_order" integer;--> statement-breakpoint
ALTER TABLE "challenge_options" ADD COLUMN "pair_id" integer;--> statement-breakpoint
ALTER TABLE "challenge_options" ADD COLUMN "is_blank" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "challenge_options" ADD COLUMN "drag_data" text;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "question_image_src" text;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "explanation" text;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "time_limit" integer;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "city" text NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "district" text NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "category" text NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "user_progress" ADD COLUMN "profile_editing_unlocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_progress" ADD COLUMN "study_buddy_unlocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_progress" ADD COLUMN "code_share_unlocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_progress" ADD COLUMN "has_infinite_hearts" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_progress" ADD COLUMN "subscription_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_reviews" ADD CONSTRAINT "lesson_reviews_booking_id_lesson_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."lesson_bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_reviews" ADD CONSTRAINT "lesson_reviews_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_reviews" ADD CONSTRAINT "lesson_reviews_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_fields" ADD CONSTRAINT "teacher_fields_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_credit_tx_user_id" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_credits_user_id" ON "user_credits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user_status" ON "user_subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_bookings_teacher_slot" ON "lesson_bookings" USING btree ("teacher_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "idx_bookings_student" ON "lesson_bookings" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_status" ON "lesson_bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_student_apps_user_id" ON "private_lesson_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_availability_teacher_week" ON "teacher_availability" USING btree ("teacher_id","week_start_date");--> statement-breakpoint
ALTER TABLE "private_lesson_applications" DROP COLUMN "price_range";--> statement-breakpoint
ALTER TABLE "teacher_applications" DROP COLUMN "price_range";--> statement-breakpoint
ALTER TABLE "user_progress" DROP COLUMN "highest_streak_achieved";