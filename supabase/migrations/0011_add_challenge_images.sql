-- Migration: Add image support to challenges
-- Add question image support to challenges table
ALTER TABLE "challenges" ADD COLUMN "question_image_src" text;

-- Note: challenge_options table already has image_src field
-- This migration just adds the missing question image support 