/**
 * Transactional e-posta cephesi.
 *
 * Önce SMTP (Nodemailer) yapılandırılmış mı bakar; varsa onu kullanır.
 * Aksi halde Resend HTTP API'sine düşer. İkisi de yoksa `error_log`'a
 * "yapılandırma eksik" satırı atar ve `false` döner.
 *
 * Tüm transactional gönderim noktaları (ilk-mesaj e-postası, admin test
 * uçları, ileride şifre değişikliği bildirimi vs.) bu cepheyi çağırır.
 * Sağlayıcı değişimi yalnız burada yapılır.
 *
 * `escapeHtml` mevcut çağrı yerlerinin başka modülü import etmesine
 * gerek kalmasın diye buradan yeniden export edilir.
 */

import "server-only";

import { logger } from "@/lib/logger";
import {
  isSmtpConfigured,
  sendEmailViaSmtp,
} from "@/lib/transactional-email-smtp";
import {
  escapeHtml as escapeHtmlImpl,
  sendEmailViaResend,
} from "@/lib/transactional-email-resend";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type TransactionalEmailProvider = "smtp" | "resend" | "none";

export function getEmailProvider(): TransactionalEmailProvider {
  if (isSmtpConfigured()) return "smtp";
  if (isResendConfigured()) return "resend";
  return "none";
}

export function isResendConfigured(): boolean {
  return (
    Boolean(process.env.RESEND_API_KEY?.trim()) &&
    Boolean(process.env.RESEND_FROM?.trim())
  );
}

/**
 * E-posta gönder. Yapılandırılmış ilk sağlayıcıyı kullanır; başarısızsa
 * sonraki sağlayıcıya **düşmez** (yarı-iletim hatasını saklamamak için).
 * Çağıran taraf `false` dönerse retry/rollback davranışını uygular.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const provider = getEmailProvider();
  switch (provider) {
    case "smtp":
      return sendEmailViaSmtp(input);
    case "resend":
      return sendEmailViaResend(input);
    default:
      logger.error({
        message:
          "Transactional e-posta gönderilemedi: hiçbir sağlayıcı yapılandırılmamış (SMTP_* veya RESEND_* env'leri eksik)",
        location: "transactional-email/sendEmail",
        fields: {
          to: input.to,
          subject: input.subject,
        },
      });
      return false;
  }
}

export const escapeHtml = escapeHtmlImpl;
