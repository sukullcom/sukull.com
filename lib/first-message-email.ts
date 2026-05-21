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
 *
 *  - Gözlemlenebilirlik: skip nedenleri `logger.error` ile `error_log`'a
 *    yazılır (admin paneli `/admin/errors` üzerinden görür). Başarılı
 *    gönderimde de info log düşer. "Sessiz başarısızlık" ihtimalini
 *    sıfıra indirir.
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
import { escapeHtml, sendEmail } from "@/lib/transactional-email";

type SkipReason =
  | "invalid_chat_id"
  | "chat_not_pair"
  | "sender_not_participant"
  | "no_recipient"
  | "already_notified"
  | "recipient_no_email"
  | "resend_failed"
  | "claim_failed";

type NotifyResult =
  | { sent: true; recipientId: string }
  | { sent: false; reason: SkipReason };

const LOCATION = "first-message-email/notifyFirstMessageIfApplicable";

/**
 * Bildirim sıkıntılarını `error_log`'a yazmak için tek noktadan helper.
 * Bunlar yıkıcı hata değil, ama operatörün görmesi gereken anomaliler:
 *  - Resend env eksik
 *  - Migration uygulanmamış (`relation … does not exist`)
 *  - Alıcının e-postası yok
 *  - Resend API'sinden 4xx/5xx
 *
 * `logger.error` `error_log`'a INSERT atar; warn yalnız console'da kalır,
 * Vercel logları kullanıcı tarafından görülmediğinden tanı zorlaşıyor.
 */
function logAnomaly(
  message: string,
  fields: Record<string, unknown>,
  error?: unknown,
): void {
  logger.error({
    message,
    error,
    location: LOCATION,
    fields,
  });
}

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
    logAnomaly("First-message email skipped: chat_not_pair", {
      chatId,
      participantsCount: participants.length,
    });
    return { sent: false, reason: "chat_not_pair" };
  }
  if (!participants.includes(input.senderId)) {
    logAnomaly("First-message email skipped: sender not participant", {
      chatId,
      senderId: input.senderId,
    });
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
  let inserted: { chatId: number }[] = [];
  try {
    inserted = await db
      .insert(chatFirstMessageNotifications)
      .values({
        chatId,
        recipientId,
        senderId: input.senderId,
        context,
      })
      .onConflictDoNothing({ target: chatFirstMessageNotifications.chatId })
      .returning({ chatId: chatFirstMessageNotifications.chatId });
  } catch (err) {
    // Tipik kök sebep: migration 0050 üretime uygulanmamış (`relation
    // "chat_first_message_notifications" does not exist`). Sessiz kalmayalım.
    logAnomaly(
      "First-message email skipped: idempotency claim failed (migration uygulanmadı olabilir)",
      { chatId, recipientId, context },
      err,
    );
    return { sent: false, reason: "claim_failed" };
  }

  if (inserted.length === 0) {
    logger.info("First-message email skipped: already_notified", {
      chatId,
      recipientId,
      context,
      location: LOCATION,
    });
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
    // Alıcı e-postasını eklerse bir sonraki ilk-mesaj denemesinde bildirim
    // gitebilsin diye iddiayı GERİ ALIYORUZ. Aksi halde "sohbete bir kere
    // ilk-mesaj denedik, ileride hiçbir zaman atmayız" durumu kalır.
    await rollbackClaim(chatId, "recipient_no_email");
    logAnomaly("First-message email skipped: recipient has no email", {
      chatId,
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

  const ok = await sendEmail({ to, subject, html });
  if (!ok) {
    // Sağlayıcı (SMTP veya Resend HTTP) hata verdi ya da hiç
    // yapılandırılmamış. Idempotency satırını geri al ki sonra düzeltilirse
    // tekrar denenebilsin. Sağlayıcı katmanları ayrıntılı hatayı zaten
    // `error_log`'a yazdı; biz burada bildirim seviyesinde özet basıyoruz.
    await rollbackClaim(chatId, "email_failed");
    logAnomaly(
      "First-message email failed (e-posta sağlayıcısı kapalı veya yapılandırma eksik)",
      { chatId, recipientId, context },
    );
    return { sent: false, reason: "resend_failed" };
  }

  logger.info("First-message email sent", {
    chatId,
    recipientId,
    context,
    location: LOCATION,
  });

  return { sent: true, recipientId };
}

async function rollbackClaim(chatId: number, reason: string): Promise<void> {
  await db
    .delete(chatFirstMessageNotifications)
    .where(eq(chatFirstMessageNotifications.chatId, chatId))
    .catch((err) => {
      logger.warn("Failed to roll back idempotency row", {
        chatId,
        reason,
        location: LOCATION,
        error:
          err instanceof Error
            ? { name: err.name, message: err.message }
            : { raw: String(err) },
      });
    });
}
