/**
 * Sohbet başına bir kez "ilk mesaj geldi" e-postası gönderir.
 *
 * Mantık:
 *  - `chat_first_message_notifications` tablosunda `chat_id` PRIMARY KEY.
 *  - `INSERT … ON CONFLICT DO NOTHING RETURNING` ile satır yazılabilirse
 *    e-posta tetiklenir; satır 0 dönerse bu sohbet için daha önce bildirim
 *    gitmiş demektir, sessizce çıkılır.
 *  - Bu sayede:
 *      * Race şartı altında iki paralel çağrı gelse bile yalnız biri kazanır.
 *      * İstemci aynı endpoint'i tekrar çağırsa (retry, double-click) ikinci
 *        çağrı no-op olur — kullanıcı spam'lenmez.
 *      * Sohbet `study_buddy_chats` kaskadıyla silinirse satır da silinir;
 *        aynı id yeniden oluşamaz (PK yeni sıradan üretilir) → güvenli.
 *
 *  - Bağlamı (private-lesson vs study-buddy) `messageUnlocks` satırının
 *    varlığından otomatik tespit ediyoruz; çağıran tarafın bunu vermesine
 *    gerek yok.
 */

import db from "@/db/drizzle";
import {
  chatFirstMessageNotifications,
  messageUnlocks,
  studyBuddyChats,
  users,
} from "@/db/schema";
import { getApiUrl } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  escapeHtml,
  sendEmailViaResend,
} from "@/lib/transactional-email-resend";

type NotifyResult =
  | { sent: true; recipientId: string }
  | { sent: false; reason: string };

export async function notifyFirstMessageIfApplicable(input: {
  chatId: number;
  senderId: string;
  messagePreview: string;
}): Promise<NotifyResult> {
  const chatId = input.chatId;
  if (!Number.isFinite(chatId) || chatId <= 0) {
    return { sent: false, reason: "invalid_chat_id" };
  }

  const chat = await db.query.studyBuddyChats.findFirst({
    where: eq(studyBuddyChats.id, chatId),
    columns: { participants: true },
  });
  const participants = chat?.participants ?? [];
  if (participants.length !== 2) {
    return { sent: false, reason: "chat_not_pair" };
  }
  if (!participants.includes(input.senderId)) {
    return { sent: false, reason: "sender_not_participant" };
  }
  const recipientId = participants.find((p) => p !== input.senderId);
  if (!recipientId) return { sent: false, reason: "no_recipient" };

  // Bağlamı message_unlocks ile tespit et (varsa özel ders, yoksa study-buddy).
  const unlock = await db.query.messageUnlocks.findFirst({
    where: eq(messageUnlocks.chatId, chatId),
    columns: { id: true },
  });
  const context: "private-lesson" | "study-buddy" = unlock
    ? "private-lesson"
    : "study-buddy";

  // Idempotency claim — yalnız ilk başaranın e-posta gönderme hakkı olur.
  const inserted = await db
    .insert(chatFirstMessageNotifications)
    .values({
      chatId,
      recipientId,
      senderId: input.senderId,
      context,
    })
    .onConflictDoNothing({ target: chatFirstMessageNotifications.chatId })
    .returning({ chatId: chatFirstMessageNotifications.chatId });

  if (inserted.length === 0) {
    return { sent: false, reason: "already_notified" };
  }

  const [recipient, sender] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, recipientId),
      columns: { email: true, name: true },
    }),
    db.query.users.findFirst({
      where: eq(users.id, input.senderId),
      columns: { name: true },
    }),
  ]);

  const to = recipient?.email?.trim();
  if (!to) {
    logger.debug("First-message email skipped: recipient has no email", {
      recipientId,
      context,
    });
    return { sent: false, reason: "recipient_no_email" };
  }

  const senderLabel = escapeHtml(
    (sender?.name ?? "").trim() || "Bir kullanıcı",
  );
  const recipientLabel = (recipient?.name ?? "").trim();
  const previewRaw = input.messagePreview.trim().slice(0, 280);
  const preview = escapeHtml(previewRaw);

  const base = getApiUrl().replace(/\/$/, "");
  const link =
    context === "private-lesson"
      ? `${base}/private-lesson/messages/${chatId}`
      : `${base}/study-buddy`;

  const subject =
    context === "private-lesson"
      ? "Sukull — Özel derste yeni bir mesaj"
      : "Sukull — Study Buddy'de yeni bir mesaj";

  const contextLabel =
    context === "private-lesson" ? "özel ders sohbetinde" : "Study Buddy sohbetinde";

  const greeting = recipientLabel
    ? `Merhaba ${escapeHtml(recipientLabel)},`
    : "Merhaba,";

  const html = `
    <p>${greeting}</p>
    <p><strong>${senderLabel}</strong> sizinle ${contextLabel} iletişim kurmak için ilk mesajını gönderdi.</p>
    <blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #6366f1;background:#f8fafc;">
      ${preview || "<em>(boş)</em>"}
    </blockquote>
    <p><a href="${escapeHtml(link)}">Mesajı Sukull'da aç</a></p>
    <p style="font-size:12px;color:#64748b;">Bu e-posta yalnızca sohbetin ilk mesajı için gönderilir; sonraki yazışmalarda bildirim gitmez.</p>
  `.trim();

  const ok = await sendEmailViaResend({ to, subject, html });
  if (!ok) {
    // Resend hata verdi: idempotency satırını GERİ AL → bir sonraki denemede
    // tekrar yollayabilelim. Aksi halde başarısız bir bildirim sonsuza dek
    // "gönderilmiş" sayılır.
    await db
      .delete(chatFirstMessageNotifications)
      .where(eq(chatFirstMessageNotifications.chatId, chatId))
      .catch((err) => {
        logger.warn("Failed to roll back idempotency row", {
          chatId,
          location: "first-message-email/notifyFirstMessageIfApplicable",
          error:
            err instanceof Error
              ? { name: err.name, message: err.message }
              : { raw: String(err) },
        });
      });
    return { sent: false, reason: "resend_failed" };
  }

  logger.info("First-message email sent", {
    chatId,
    recipientId,
    context,
    location: "first-message-email/notifyFirstMessageIfApplicable",
  });

  return { sent: true, recipientId };
}
