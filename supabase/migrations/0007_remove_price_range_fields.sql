-- Migration: Remove price_range fields
-- This migration removes price_range columns from teacher_applications and private_lesson_applications tables

-- Remove price_range column from teacher_applications table
ALTER TABLE "teacher_applications" DROP COLUMN IF EXISTS "price_range";

-- Remove price_range column from private_lesson_applications table  
ALTER TABLE "private_lesson_applications" DROP COLUMN IF EXISTS "price_range"; 