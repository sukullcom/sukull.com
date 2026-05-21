/**
 * SMTP üzerinden (Nodemailer) transactional e-posta gönderici.
 *
 * Supabase Auth SMTP ayarınız ile aynı sağlayıcıyı yeniden kullanmak için
 * tasarlandı: Resend, SendGrid, AWS SES, Mailgun, kendi Postfix sunucunuz,
 * fark etmez — Nodemailer hepsiyle aynı arayüzle konuşur.
 *
 * Gereken env'ler:
 *  - SMTP_HOST  → ör. `smtp.resend.com`
 *  - SMTP_PORT  → 465 (SSL) veya 587 (STARTTLS)
 *  - SMTP_USER  → ör. `resend` (Resend için sabit) ya da SES kullanıcı adı
 *  - SMTP_PASS  → ör. Resend API key (`re_…`) veya SES password
 *  - SMTP_FROM  → ör. `Sukull <noreply@sukull.com>` (doğrulanmış gönderici)
 *
 * Üretimde Vercel Serverless Function başına bir transport yeniden
 * kullanılır (modül scope'unda lazy init); cold start dışında handshake
 * her istek için tekrarlanmaz.
 *
 * `lib/transactional-email.ts` cephesi tarafından çağrılır; doğrudan
 * import etmeyin — sağlayıcı geçişlerinde sadece o cephe değişsin.
 */

import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { logger } from "@/lib/logger";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let cachedTransport: Transporter | null = null;
let cachedKey = "";

function buildTransportKey(): string {
  return [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER,
    process.env.SMTP_PASS,
  ]
    .map((v) => v ?? "")
    .join("|");
}

/**
 * Lazy transport. Yapılandırma değişirse otomatik yeniden kurulur (key
 * hash karşılaştırması). Hot path'te tek transport, soğukta tek
 * handshake.
 */
function getTransport(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  const port = Number(portRaw ?? "465");
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;

  const key = buildTransportKey();
  if (cachedTransport && cachedKey === key) return cachedTransport;

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    // 465 → implicit TLS, diğerlerinde STARTTLS.
    secure: port === 465,
    auth: { user, pass },
  });
  cachedKey = key;
  return cachedTransport;
}

export function isSmtpConfigured(): boolean {
  return (
    Boolean(process.env.SMTP_HOST?.trim()) &&
    Boolean(process.env.SMTP_USER?.trim()) &&
    Boolean(process.env.SMTP_PASS?.trim()) &&
    Boolean(process.env.SMTP_FROM?.trim())
  );
}

export async function sendEmailViaSmtp(
  input: SendEmailInput,
): Promise<boolean> {
  const from = process.env.SMTP_FROM?.trim();
  const transport = getTransport();
  if (!transport || !from) {
    logger.error({
      message: "SMTP skipped: SMTP_HOST/USER/PASS/FROM yapılandırması eksik",
      location: "transactional-email-smtp/sendEmailViaSmtp",
      fields: {
        hasHost: Boolean(process.env.SMTP_HOST?.trim()),
        hasUser: Boolean(process.env.SMTP_USER?.trim()),
        hasPass: Boolean(process.env.SMTP_PASS?.trim()),
        hasFrom: Boolean(from),
      },
    });
    return false;
  }

  try {
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? stripHtml(input.html),
    });
    return true;
  } catch (err) {
    logger.error({
      message: "SMTP send failed",
      error: err,
      location: "transactional-email-smtp/sendEmailViaSmtp",
      fields: {
        to: input.to,
        subject: input.subject,
      },
    });
    return false;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
