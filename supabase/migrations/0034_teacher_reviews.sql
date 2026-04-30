-- One-time student → teacher reviews after accepted listing offer or two-way messaging.
-- Aligns with marketplace: teacher_id / student_id are auth user ids (text).

CREATE TABLE IF NOT EXISTS teacher_reviews (
  id BIGSERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  offer_id INTEGER NULL REFERENCES listing_offers (id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT teacher_reviews_rating_range CHECK (rating >= 1 AND rating <= 10),
  CONSTRAINT teacher_reviews_comment_len CHECK (comment IS NULL OR char_length(comment) <= 500),
  CONSTRAINT teacher_reviews_student_teacher_uniq UNIQUE (student_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_reviews_teacher_rating
  ON teacher_reviews (teacher_id, rating);

COMMENT ON TABLE teacher_reviews IS 'Single review per (student, teacher); eligibility via accepted listing_offers or recent two-way private-lesson messages.';
