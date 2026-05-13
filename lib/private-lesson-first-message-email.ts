import db from "@/db/drizzle";
import { messageUnlocks, studyBuddyChats, users } from "@/db/schema";
import { getApiUrl } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  escapeHtml,
  sendEmailViaResend,
} from "@/lib/transactional-email-resend";

/**
 * When the first line is posted to a private-lesson thread (unlock or listing
 * offer), notify the other participant by email. No-op if chat is not tied to
 * `message_unlocks`, recipient has no email, or Resend is not configured.
 */
export async function notifyPrivateLessonFirstMessageIfApplicable(input: {
  chatId: number;
  senderId: string;
  messagePreview: string;
}): Promise<void> {
  const unlock = await db.query.messageUnlocks.findFirst({
    where: eq(messageUnlocks.chatId, input.chatId),
    columns: { id: true },
  });
  if (!unlock) return;

  const chat = await db.query.studyBuddyChats.findFirst({
    where: eq(studyBuddyChats.id, input.chatId),
    columns: { participants: true },
  });
  const participants = chat?.participants ?? [];
  if (participants.length !== 2) return;

  const recipientId = participants.find((p) => p !== input.senderId);
  if (!recipientId) return;

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
    });
    return;
  }

  const senderLabel = escapeHtml(
    (sender?.name ?? "").trim() || "Bir kullanıcı",
  );
  const previewRaw = input.messagePreview.trim().slice(0, 280);
  const preview = escapeHtml(previewRaw);
  const base = getApiUrl().replace(/\/$/, "");
  const link = `${base}/private-lesson/messages/${input.chatId}`;

  const subject = "Sukull — Özel derste yeni bir mesaj";
  const html = `
    <p>Merhaba,</p>
    <p><strong>${senderLabel}</strong> sizinle iletişim kurmak için sohbette ilk mesajını gönderdi.</p>
    <blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #6366f1;background:#f8fafc;">
      ${preview || "<em>(boş)</em>"}
    </blockquote>
    <p><a href="${escapeHtml(link)}">Mesajı Sukull’da aç</a></p>
    <p style="font-size:12px;color:#64748b;">Bu e-posta yalnızca sohbetin ilk mesajı için gönderilir; sonraki yazışmalarda bildirim gitmez.</p>
  `.trim();

  await sendEmailViaResend({ to, subject, html });
}
