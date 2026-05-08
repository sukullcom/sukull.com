"use server";

import { headers } from "next/headers";
import { sql } from "drizzle-orm";

import db from "@/db/drizzle";
import { users } from "@/db/schema";
import {
  checkRateLimit,
  getClientIpFromHeaders,
  RATE_LIMITS,
} from "@/lib/rate-limit-db";
import { getServerAuthCallbackUrl } from "@/lib/oauth-callback-url";
import { ensurePublicUserFromAuth } from "@/lib/ensure-public-user";
import { getAuthError } from "@/utils/auth-errors";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import { normalizeReferralCode } from "@/lib/referral-code";

const log = logger.child({ labels: { module: "auth/create-account" } });

const MIN_PASSWORD_LEN = 8;
const MAX_USERNAME_LEN = 80;

export type SignUpWithEmailResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * E-posta + şifre kaydı: IP rate limit, `public.users` üzerinde e-posta
 * kontrolü (Drizzle), Supabase Auth `signUp` (sunucu istemcisi).
 */
export async function signUpWithEmail(
  formData: FormData,
): Promise<SignUpWithEmailResult> {
  const usernameRaw = String(formData.get("username") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const legal = String(formData.get("legalAccepted") ?? "");

  if (legal !== "1") {
    return {
      ok: false,
      error:
        "Devam etmek için Kullanım Şartları, Gizlilik Politikası ve KVKK Aydınlatma Metni'ni kabul etmelisiniz.",
    };
  }

  if (!usernameRaw) {
    return { ok: false, error: "Lütfen bir kullanıcı adı giriniz." };
  }
  if (usernameRaw.length > MAX_USERNAME_LEN) {
    return { ok: false, error: "Kullanıcı adı çok uzun." };
  }

  const emailLower = emailRaw.toLowerCase();
  if (!emailRaw || !emailLower.includes("@")) {
    return { ok: false, error: "Lütfen geçerli bir e-posta adresi giriniz." };
  }

  if (password.length < MIN_PASSWORD_LEN) {
    return {
      ok: false,
      error: `Şifre en az ${MIN_PASSWORD_LEN} karakter olmalıdır.`,
    };
  }

  const h = await headers();
  const ip = getClientIpFromHeaders(h);
  const rl = await checkRateLimit({
    key: `signup:ip:${ip}`,
    ...RATE_LIMITS.signupIp,
  });
  if (!rl.allowed) {
    return {
      ok: false,
      error: `Çok sık kayıt denemesi. Lütfen yaklaşık ${Math.ceil(rl.retryAfter / 60)} dakika sonra tekrar deneyin.`,
    };
  }

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${emailLower}`)
      .limit(1);

    if (existing.length > 0) {
      return {
        ok: false,
        error:
          "Bu e-posta adresi zaten kayıtlı. Bunun yerine giriş yapmayı deneyiniz.",
      };
    }
  } catch (e) {
    log.error({
      message: "signup email lookup failed",
      error: e,
      location: "create-account/actions/emailLookup",
    });
    return {
      ok: false,
      error: "Kayıt şu an tamamlanamadı. Lütfen kısa bir süre sonra tekrar deneyin.",
    };
  }

  try {
    const supabase = await createClient();
    const referralMeta = normalizeReferralCode(
      String(formData.get("referralCode") ?? ""),
    );
    const { data, error } = await supabase.auth.signUp({
      email: emailRaw,
      password,
      options: {
        emailRedirectTo: getServerAuthCallbackUrl(),
        data: {
          username: usernameRaw,
          ...(referralMeta ? { referral_code: referralMeta } : {}),
        },
      },
    });

    if (error) {
      const { message } = getAuthError(error);
      return { ok: false, error: message };
    }

    if (!data.user) {
      return {
        ok: false,
        error: "Kullanıcı hesabı oluşturulamadı. Lütfen tekrar deneyiniz.",
      };
    }

    if (data.user.email_confirmed_at) {
      try {
        await ensurePublicUserFromAuth(data.user, usernameRaw);
      } catch (e) {
        log.error({
          message: "ensurePublicUserFromAuth after immediate signup confirm failed",
          error: e,
          location: "create-account/actions/ensurePublicUser",
          userId: data.user.id,
        });
      }
    }

    return { ok: true };
  } catch (e) {
    log.error({
      message: "signup server action failed",
      error: e,
      location: "create-account/actions/signUp",
    });
    if (e instanceof Error && e.message.includes("NEXT_PUBLIC_APP_URL")) {
      return {
        ok: false,
        error: "Sunucu yapılandırması eksik. Lütfen destek ile iletişime geçin.",
      };
    }
    const { message } = getAuthError(e);
    return { ok: false, error: message };
  }
}
