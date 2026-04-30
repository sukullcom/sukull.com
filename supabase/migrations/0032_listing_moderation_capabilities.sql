-- Listing moderation + eğitmen başvurusunda çoklu alan/sınıf (JSON)
-- listing_status: inceleme bekleyen ve reddedilen
DO $$
BEGIN
  ALTER TYPE listing_status ADD VALUE 'pending_review';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE listing_status ADD VALUE 'rejected';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE teacher_applications
  ADD COLUMN IF NOT EXISTS capabilities_json jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN teacher_applications.capabilities_json IS 'Eğitmenin seçtiği {subject, grade} çiftleri; onayda teacher_fields üretilir.';

-- Mevcut açık ilanlar yayında kalsın; yeni satırlar varsayılan olarak incelemede oluşsun.
ALTER TABLE listings
  ALTER COLUMN status SET DEFAULT 'pending_review';
