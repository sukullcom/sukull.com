CREATE TABLE "study_buddy_chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"participants" json NOT NULL,
	"last_message" text DEFAULT '',
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_buddy_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" integer NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_buddy_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"purpose" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"avatar" text DEFAULT '',
	"provider" text NOT NULL,
	"links" json DEFAULT '[]'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_progress" RENAME COLUMN "last_lesson_completed_at" TO "daily_target";--> statement-breakpoint
ALTER TABLE "user_progress" ADD COLUMN "last_streak_check" timestamp;--> statement-breakpoint
ALTER TABLE "user_progress" ADD COLUMN "previous_total_points" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "study_buddy_messages" ADD CONSTRAINT "study_buddy_messages_chat_id_study_buddy_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."study_buddy_chats"("id") ON DELETE cascade ON UPDATE no action;