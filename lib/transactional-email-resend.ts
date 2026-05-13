import { logger } from "@/lib/logger";

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
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) {
    logger.debug("Resend skipped: RESEND_API_KEY or RESEND_FROM unset", {
      location: "transactional-email-resend/sendEmailViaResend",
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
