-- Migration: Add Infinite Hearts Subscription System
-- This migration adds subscription functionality for premium infinite hearts feature

-- Add subscription fields to user_progress table
ALTER TABLE "user_progress" 
ADD COLUMN "has_infinite_hearts" boolean DEFAULT false NOT NULL,
ADD COLUMN "subscription_expires_at" timestamp;

-- Create user_subscriptions table for tracking monthly payments
CREATE TABLE IF NOT EXISTS "user_subscriptions" (
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

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index for faster lookups by user and status
CREATE INDEX IF NOT EXISTS "user_subscriptions_user_id_idx" ON "user_subscriptions" ("user_id");
CREATE INDEX IF NOT EXISTS "user_subscriptions_status_idx" ON "user_subscriptions" ("status");
CREATE INDEX IF NOT EXISTS "user_subscriptions_end_date_idx" ON "user_subscriptions" ("end_date"); 