"use server";

import { headers } from "next/headers";
import { sql } from "drizzle-orm";

import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { logger } from "@/lib/logger";
import { getServerAuthCallbackUrl } from "@/lib/oauth-callback-url";
import {
  checkRateLimit,
  getClientIpFromHeaders,
  RATE_LIMITS,
} from "@/lib/rate-limit-db";
import { escapeHtml, getEmailProvider, sendEmail } from "@/lib/transactional-email";
import { getSupabaseAdminClient } from "@/utils/supabase/admin";

const log = logger.child({ labels: { module: "auth/forgot-password" } });

const GENERIC =
  "Hesap mevcutsa şifre sıfırlama bağlantısı gönderilecektir.";

export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@") || normalized.length > 320) {
    return { success: false, message: "Geçerli bir e-posta yaz." };
  }

  const headerList = await headers();
  const ip = getClientIpFromHeaders(headerList);
  const limit = await checkRateLimit({
    key: `reset-password:${ip}`,
    max: RATE_LIMITS.resetPassword.max,
    windowSeconds: RATE_LIMITS.resetPassword.windowSeconds,
  });
  if (!limit.allowed) {
    return { success: false, message: "Çok fazla deneme. Bir saat sonra tekrar dene." };
  }

  const [row] = await db
    .select({ email: users.email, provider: users.provider })
    .from(users)
    .where(sql`lower(${users.email}) = ${normalized}`)
    .limit(1);

  if (!row?.email || row.provider !== "email") {
    return { success: true, message: GENERIC };
  }

  if (getEmailProvider() === "none") {
    log.error({
      message: "password reset skipped, no email provider",
      location: "forgot-password/requestPasswordReset",
    });
    return {
      success: false,
      message: "E-posta servisi şu an ayarlı değil. Biraz sonra tekrar dene.",
    };
  }

  const redirectTo = `${getServerAuthCallbackUrl()}?next=${encodeURIComponent("/reset-password")}`;
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: row.email,
    options: { redirectTo },
  });
  const link = data?.properties?.action_link;
  if (error || !link) {
    log.error({
      message: "recovery link was not created",
      error,
      location: "forgot-password/requestPasswordReset",
    });
    return {
      success: false,
      message: "Sıfırlama bağlantısı oluşturulamadı. Biraz sonra tekrar dene.",
    };
  }

  const safeLink = escapeHtml(link);
  const sent = await sendEmail({
    to: row.email,
    subject: "Sukull şifre sıfırlama",
    text: `Şifreni sıfırlamak için bu bağlantıyı aç: ${link}\n\nBu isteği sen yapmadıysan e-postayı yok say.`,
    html: `<p>Sukull hesabının şifresini sıfırlamak için aşağıdaki bağlantıyı aç.</p><p><a href="${safeLink}">Şifremi sıfırla</a></p><p>Bu isteği sen yapmadıysan e-postayı yok say.</p>`,
  });
  if (!sent) {
    return {
      success: false,
      message: "E-posta gönderilemedi. Gelen kutuna düşmedi; biraz sonra tekrar dene.",
    };
  }

  return {
    success: true,
    message: "Şifre sıfırlama bağlantısı e-posta adresine gönderildi.",
  };
}
