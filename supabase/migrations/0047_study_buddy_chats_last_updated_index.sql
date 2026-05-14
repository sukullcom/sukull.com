-- 0047: Sohbet listesi sıralama performansı
--
-- `db/queries/messages.ts → listConversationsFor` `WHERE participants @> $1
-- ORDER BY last_updated DESC LIMIT 200` çalıştırıyor. Mevcut GIN indeksi
-- (`participants_idx`) containment'ı hızlı kapsar ama **sıralamayı**
-- destekleyemediği için Postgres ek bir sort fazı atıyor. Kullanıcının
-- sohbet sayısı arttıkça bu sort hissedilir.
--
-- B-tree indeks `last_updated` üzerine eklenince planner GIN + bitmap +
-- sort yerine doğrudan indeks taraması seçebilir; her durumda sort adımı
-- ucuzlar.

CREATE INDEX IF NOT EXISTS idx_study_buddy_chats_last_updated
  ON study_buddy_chats (last_updated DESC);
