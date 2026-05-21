import { logger } from "@/lib/logger";
import { resolveSenderAddress } from "@/lib/email-sender";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Resend HTTP API (no SDK dependency). Set `RESEND_API_KEY` and `RESEND_FROM`
 * (verified sender in Resend, e.g. `Sukull <noreply@mail.sukull.com>`).
 */
export async function sendEmailViaResend(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  // "Sukull <…>" biçimini garantiliyoruz — kullanıcı RESEND_FROM'u sadece
  // e-posta olarak set etse de istemci "Sukull" görsün diye.
  const from = resolveSenderAddress(process.env.RESEND_FROM);
  if (!apiKey || !from) {
    // Bu "yapılandırma eksik" durumu üretimde bildirim sessizliğinin en
    // sık nedeni — debug yerine `error` ile `error_log`'a yazıyoruz ki
    // admin /admin/notifications panelinde 1 saniyede görsün.
    logger.error({
      message: "Resend skipped: RESEND_API_KEY or RESEND_FROM unset",
      location: "transactional-email-resend/sendEmailViaResend",
      fields: {
        hasApiKey: Boolean(apiKey),
        hasFrom: Boolean(from),
      },
    });
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text ?? stripHtml(input.html),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error({
      message: "Resend API error",
      location: "transactional-email-resend/sendEmailViaResend",
      fields: { status: res.status, body: body.slice(0, 500) },
    });
    return false;
  }
  return true;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
