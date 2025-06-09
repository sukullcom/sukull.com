-- Migration: Add achievement unlock fields to user_progress table
-- These fields track one-time achievements that permanently unlock features

ALTER TABLE "user_progress" 
ADD COLUMN "profile_editing_unlocked" boolean DEFAULT false NOT NULL,
ADD COLUMN "study_buddy_unlocked" boolean DEFAULT false NOT NULL,
ADD COLUMN "code_share_unlocked" boolean DEFAULT false NOT NULL;

-- Set existing users with sufficient streaks to already have unlocks
-- This ensures current users don't lose access to features they should have

-- Profile editing unlock (30+ days)
UPDATE "user_progress" 
SET "profile_editing_unlocked" = true 
WHERE "istikrar" >= 30;

-- Study buddy unlock (15+ days) 
UPDATE "user_progress" 
SET "study_buddy_unlocked" = true 
WHERE "istikrar" >= 15;

-- Code share unlock (30+ days)
UPDATE "user_progress" 
SET "code_share_unlocked" = true 
WHERE "istikrar" >= 30; 