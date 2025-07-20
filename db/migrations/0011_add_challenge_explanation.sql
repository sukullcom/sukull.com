-- Migration: Add explanation field to challenges table
-- This migration adds an optional explanation field that will be shown when users answer incorrectly

ALTER TABLE "challenges" ADD COLUMN "explanation" text; 