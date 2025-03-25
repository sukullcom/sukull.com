-- Add lesson_bookings table
CREATE TABLE IF NOT EXISTS "lesson_bookings" (
  "id" SERIAL PRIMARY KEY,
  "student_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "teacher_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "start_time" TIMESTAMP NOT NULL,
  "end_time" TIMESTAMP NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "meet_link" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
); 