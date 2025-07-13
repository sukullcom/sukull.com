-- Migration: Reset all user avatars to default mascot_purple.svg
-- This ensures all users have the consistent default avatar

-- Reset avatars in user_progress table (this is the main avatar used in the app)
UPDATE "user_progress" 
SET "user_image_src" = '/mascot_purple.svg'
WHERE "user_image_src" != '/mascot_purple.svg' 
   OR "user_image_src" IS NULL 
   OR "user_image_src" = '';

-- Reset avatars in users table as well (for consistency)
UPDATE "users" 
SET "avatar" = '/mascot_purple.svg'
WHERE "avatar" != '/mascot_purple.svg' 
   OR "avatar" IS NULL 
   OR "avatar" = '';

-- Update the default value for future inserts to ensure consistency
ALTER TABLE "user_progress" ALTER COLUMN "user_image_src" SET DEFAULT '/mascot_purple.svg';
ALTER TABLE "users" ALTER COLUMN "avatar" SET DEFAULT '/mascot_purple.svg'; 