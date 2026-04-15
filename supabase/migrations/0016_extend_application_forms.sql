-- Add new fields to student applications
ALTER TABLE private_lesson_applications ADD COLUMN IF NOT EXISTS student_level text;
ALTER TABLE private_lesson_applications ADD COLUMN IF NOT EXISTS lesson_duration text;
ALTER TABLE private_lesson_applications ADD COLUMN IF NOT EXISTS available_hours text;
ALTER TABLE private_lesson_applications ADD COLUMN IF NOT EXISTS budget text;
ALTER TABLE private_lesson_applications ADD COLUMN IF NOT EXISTS lesson_mode text;

-- Add new fields to teacher applications
ALTER TABLE teacher_applications ADD COLUMN IF NOT EXISTS education text;
ALTER TABLE teacher_applications ADD COLUMN IF NOT EXISTS experience_years text;
ALTER TABLE teacher_applications ADD COLUMN IF NOT EXISTS target_levels text;
ALTER TABLE teacher_applications ADD COLUMN IF NOT EXISTS available_hours text;
ALTER TABLE teacher_applications ADD COLUMN IF NOT EXISTS lesson_mode text;
ALTER TABLE teacher_applications ADD COLUMN IF NOT EXISTS hourly_rate text;
ALTER TABLE teacher_applications ADD COLUMN IF NOT EXISTS bio text;
