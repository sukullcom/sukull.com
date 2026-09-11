"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";

import db from "@/db/drizzle";
import { users } from "@/db/schema";
import {
  checkRateLimit,
  getClientIpFromHeaders,
  RATE_LIMITS,
} from "@/lib/rate-limit-db";
import {
  confirmAuthUserEmail,
  findAuthUserIdByEmail,
} from "@/lib/confirm-auth-email";
import { ensurePublicUserFromAuth } from "@/lib/ensure-public-user";
import { getAuthError } from "@/utils/auth-errors";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdminClient } from "@/utils/supabase/admin";
import { logger } from "@/lib/logger";
import { normalizeReferralCode } from "@/lib/referral-code";

const log = logger.child({ labels: { module: "auth/create-account" } });

const MIN_PASSWORD_LEN = 8;
const MAX_USERNAME_LEN = 80;

export type SignUpWithEmailResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * E-posta + şifre kaydı: doğrulama maili yok. Admin `createUser`
 * (`email_confirm: true`) hesabı hemen aktif eder; ardından
 * `signInWithPassword` oturum çerezlerini yazar.
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
    const userMetadata = {
      username: usernameRaw,
      ...(referralMeta ? { referral_code: referralMeta } : {}),
    };

    const admin = getSupabaseAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: emailRaw,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (createError) {
      const mapped = getAuthError(createError);
      if (mapped.type === "EmailInUse") {
        const signedIn = await signInExistingUnconfirmedAccount({
          supabase,
          email: emailRaw,
          password,
          username: usernameRaw,
        });
        if (signedIn === "signed-in") {
          return { ok: true };
        }
      }
      return { ok: false, error: mapped.message };
    }

    if (!created.user) {
      return {
        ok: false,
        error: "Kullanıcı hesabı oluşturulamadı. Lütfen tekrar deneyiniz.",
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailRaw,
      password,
    });

    if (error || !data.user) {
      log.error({
        message: "signup created user but sign-in failed",
        error,
        location: "create-account/actions/signInAfterCreate",
        userId: created.user.id,
      });
      return {
        ok: false,
        error:
          "Hesabınız oluşturuldu ancak giriş yapılamadı. Lütfen giriş sayfasından deneyiniz.",
      };
    }

    try {
      await ensurePublicUserFromAuth(data.user, usernameRaw);
    } catch (e) {
      log.error({
        message: "ensurePublicUserFromAuth after signup failed",
        error: e,
        location: "create-account/actions/ensurePublicUser",
        userId: data.user.id,
      });
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    log.error({
      message: "signup server action failed",
      error: e,
      location: "create-account/actions/signUp",
    });
    const { message } = getAuthError(e);
    return { ok: false, error: message };
  }
}

/**
 * Daha önce doğrulanmamış (public.users satırı olmayan) auth kullanıcısı
 * aynı e-posta + şifre ile tekrar kayıt olursa hesabı onaylayıp oturum aç.
 * Şifre uyuşmazsa "zaten kayıtlı" mesajına düşer.
 */
async function signInExistingUnconfirmedAccount({
  supabase,
  email,
  password,
  username,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  email: string;
  password: string;
  username: string;
}): Promise<"signed-in" | "not-signed-in"> {
  try {
    const existingId = await findAuthUserIdByEmail(email);
    if (!existingId) return "not-signed-in";

    await confirmAuthUserEmail(existingId);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) return "not-signed-in";

    try {
      await ensurePublicUserFromAuth(data.user, username);
    } catch (e) {
      log.error({
        message: "ensurePublicUserFromAuth after leftover signup confirm failed",
        error: e,
        location: "create-account/actions/leftoverEnsurePublicUser",
        userId: data.user.id,
      });
    }

    revalidatePath("/", "layout");
    return "signed-in";
  } catch (e) {
    log.error({
      message: "leftover unconfirmed signup sign-in failed",
      error: e,
      location: "create-account/actions/leftoverSignIn",
    });
    return "not-signed-in";
  }
}
