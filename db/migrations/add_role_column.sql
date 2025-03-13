-- First, create the role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "role" AS ENUM ('user', 'teacher', 'admin');
EXCEPTION
    WHEN duplicate_object THEN
    NULL;
END $$;

-- Add the role column to the users table with a default value of 'user'
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "role" "role" NOT NULL DEFAULT 'user';

-- After adding the column, update any existing users 
-- to have appropriate roles based on some criteria
-- For example, you might want to set certain emails as admins:
UPDATE "users" 
SET "role" = 'admin' 
WHERE "email" LIKE '%admin%';

-- Set teachers
UPDATE "users" 
SET "role" = 'teacher' 
WHERE EXISTS (
    SELECT 1 FROM "teacher_applications" 
    WHERE "teacher_applications"."userId" = "users"."id" 
    AND "teacher_applications"."status" = 'approved'
); 