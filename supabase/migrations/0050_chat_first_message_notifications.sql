-- 0050: Sohbet başına yalnızca *bir kez* ilk mesaj e-postası gitsin diye
-- idempotency tablosu.
--
-- `study_buddy_chats` hem study-buddy hem özel ders mesajlaşmasında tek tablo
-- olarak kullanılıyor (private-lesson tarafında bir `message_unlocks` satırı
-- da olur). Bildirim mantığı bu tek tabloda toplandığı için anahtarımız da
-- `chat_id`.
--
-- Yardımcı `notifyFirstMessageIfApplicable` `INSERT … ON CONFLICT DO NOTHING
-- RETURNING` ile yarış / yeniden tetikleme durumlarında **yalnız bir** e-posta
-- gönderir. Aynı çağrı tekrar gelse satır 0 döner, no-op.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chat_first_message_notifications (
  chat_id      integer PRIMARY KEY REFERENCES public.study_buddy_chats(id) ON DELETE CASCADE,
  recipient_id text NOT NULL,
  sender_id    text NOT NULL,
  context      text NOT NULL DEFAULT 'study-buddy',
  notified_at  timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_first_msg_notif_recipient
  ON public.chat_first_message_notifications (recipient_id);

-- RLS: politikasız aktif — yalnızca tablo sahibi (sunucu Drizzle) yazabilir.
-- E-posta + sender_id PII içerebilir; tarayıcıdan görünmesin.
ALTER TABLE public.chat_first_message_notifications ENABLE ROW LEVEL SECURITY;

COMMIT;
