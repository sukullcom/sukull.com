-- Speed up lookup by chat when sending first-message notification emails.
CREATE INDEX IF NOT EXISTS idx_message_unlocks_chat_id
  ON public.message_unlocks (chat_id)
  WHERE chat_id IS NOT NULL;
