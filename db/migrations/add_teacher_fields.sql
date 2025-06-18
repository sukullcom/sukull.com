-- Create teacher_fields table for multi-field support
CREATE TABLE IF NOT EXISTS "teacher_fields" (
  "id" SERIAL PRIMARY KEY,
  "teacher_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "subject" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "teacher_fields_teacher_id_idx" ON "teacher_fields"("teacher_id");
CREATE INDEX IF NOT EXISTS "teacher_fields_subject_idx" ON "teacher_fields"("subject");
CREATE INDEX IF NOT EXISTS "teacher_fields_grade_idx" ON "teacher_fields"("grade");
CREATE INDEX IF NOT EXISTS "teacher_fields_active_idx" ON "teacher_fields"("is_active");

-- Migrate existing data from teacher_applications to teacher_fields
-- This will handle the existing single field format and convert it to the new multi-field format
INSERT INTO "teacher_fields" ("teacher_id", "subject", "grade", "display_name", "created_at", "updated_at")
SELECT 
  ta.user_id,
  CASE 
    -- Extract subject from field if it contains grade info
    WHEN ta.field LIKE '%sınıf%' OR ta.field LIKE '%Sınıf%' THEN 
      TRIM(REGEXP_REPLACE(ta.field, '[0-9]+\.?\s*(sınıf|Sınıf)', '', 'g'))
    ELSE ta.field
  END as subject,
  CASE 
    -- Extract grade from field if it contains grade info
    WHEN ta.field LIKE '%sınıf%' OR ta.field LIKE '%Sınıf%' THEN 
      REGEXP_REPLACE(ta.field, '.*?([0-9]+\.?\s*(sınıf|Sınıf)).*', '\1', 'g')
    ELSE 'Genel' -- Default grade for fields without specific grade
  END as grade,
  ta.field as display_name,
  ta.created_at,
  ta.updated_at
FROM "teacher_applications" ta
WHERE ta.status = 'approved'
  AND ta.user_id IN (SELECT id FROM "users" WHERE role = 'teacher')
ON CONFLICT DO NOTHING; 