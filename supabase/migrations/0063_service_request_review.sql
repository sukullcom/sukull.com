-- Hizmet talepleri admin onayından sonra yayınlanır.
-- pending: incelemede, open: yayında, rejected: reddedildi (not ile).
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_status_chk;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_status_chk
  CHECK (status IN ('pending', 'open', 'accepted', 'expired', 'rejected'));

ALTER TABLE public.service_requests ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS rejection_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by text REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_rejection_note_chk;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_rejection_note_chk
  CHECK (rejection_note IS NULL OR char_length(rejection_note) <= 500);

-- İstemci (PostgREST) talebi onaysız yayına alamasın. Uygulama yazmaları sunucudan yapar.
DROP POLICY IF EXISTS service_requests_insert_own ON public.service_requests;
CREATE POLICY service_requests_insert_own ON public.service_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = (SELECT auth.uid()::text)
    AND status = 'pending'
    AND quote_count = 0
    AND rejection_note IS NULL
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
  );

DROP POLICY IF EXISTS service_requests_update_own ON public.service_requests;

CREATE INDEX IF NOT EXISTS idx_service_requests_review_queue
  ON public.service_requests (status, created_at DESC);
