-- Migration: Add support for new challenge types
-- This migration adds new challenge types and required fields

-- Add new challenge types to the enum
ALTER TYPE "type" ADD VALUE 'DRAG_DROP';
ALTER TYPE "type" ADD VALUE 'FILL_BLANK';
ALTER TYPE "type" ADD VALUE 'MATCH_PAIRS';
ALTER TYPE "type" ADD VALUE 'SEQUENCE';
ALTER TYPE "type" ADD VALUE 'TIMER_CHALLENGE';

-- Add new columns to challenges table
ALTER TABLE "challenges" ADD COLUMN "time_limit" integer;
ALTER TABLE "challenges" ADD COLUMN "metadata" text;

-- Add new columns to challenge_options table
ALTER TABLE "challenge_options" ADD COLUMN "correct_order" integer;
ALTER TABLE "challenge_options" ADD COLUMN "pair_id" integer;
ALTER TABLE "challenge_options" ADD COLUMN "is_blank" boolean DEFAULT false;
ALTER TABLE "challenge_options" ADD COLUMN "drag_data" text; 