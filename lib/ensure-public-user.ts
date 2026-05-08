/**
 * auth.users (Supabase) ile aynı id'ye sahip public.users satırı.
 * OAuth / callback API route'unda tarayıcı Supabase client'ına güvenmek
 * PKCE yok, RLS veya context nedeniyle başarısız olabiliyor; bu yüzden
 * sunucu tarafında Drizzle ile eklenir.
 *
 * INSERT ... ON CONFLICT DO NOTHING ile çift tıklama / eşzamanlı giriş
 * yarışlarında unique ihlali oluşmaz (login server action dahil).
 */
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

import { REFERRAL_SYSTEM } from "@/constants";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { logActivity } from "@/lib/activity-logger";
import { normalizeReferralCode } from "@/lib/referral-code";
import { allocateUniqueReferralCode, recordReferralSignupRewardTx } from "@/lib/referral-grant";

export async function ensurePublicUserFromAuth(
  authUser: User,
  overrideUsername?: string,
  pendingReferralFromCookie?: string | null,
) {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  });
  if (existing) {
    return existing;
  }

  const provider = (authUser.app_metadata?.provider as string) || "email";
  let name: string | undefined = overrideUsername;
  let avatar = "/mascot_purple.svg";

  if (!name) {
    if (provider === "google") {
      const googleName =
        (authUser.user_metadata?.name as string | undefined) ||
        (authUser.user_metadata?.full_name as string | undefined);
      if (googleName) {
        name = googleName;
      }
      avatar =
        (authUser.user_metadata?.avatar_url as string) ||
        `https://api.dicebear.com/9.x/bottts/svg?seed=${authUser.id}`;
    } else {
      const meta = authUser.user_metadata as Record<string, unknown> | undefined;
      const metaUsername =
        typeof meta?.username === "string" && meta.username.trim()
          ? meta.username.trim()
          : undefined;
      name =
        (authUser.user_metadata?.full_name as string | undefined) ||
        metaUsername ||
        authUser.email?.split("@")[0] ||
        "User";
    }
  }

  const email = authUser.email || "";
  const finalName = (name || email.split("@")[0] || "User") as string;

  const metaRef =
    typeof authUser.user_metadata?.referral_code === "string"
      ? authUser.user_metadata.referral_code
      : undefined;
  const refCode = normalizeReferralCode(metaRef || pendingReferralFromCookie || undefined);

  const referralGrant: {
    current: { referrerId: string; refereeId: string } | null;
  } = { current: null };

  const row = await db.transaction(async (tx) => {
    const again = await tx.query.users.findFirst({
      where: eq(users.id, authUser.id),
    });
    if (again) {
      return again;
    }

    let referredByUserId: string | null = null;
    if (refCode) {
      const referrer = await tx.query.users.findFirst({
        where: eq(users.referralCode, refCode),
        columns: { id: true },
      });
      if (referrer && referrer.id !== authUser.id) {
        referredByUserId = referrer.id;
      }
    }

    const referralCode = await allocateUniqueReferralCode(tx);

    const inserted = await tx
      .insert(users)
      .values({
        id: authUser.id,
        email,
        name: finalName,
        avatar,
        provider,
        description: "",
        links: [],
        referralCode,
        referredByUserId,
      })
      .onConflictDoNothing({ target: users.id })
      .returning({ id: users.id });

    const created = await tx.query.users.findFirst({
      where: eq(users.id, authUser.id),
    });

    if (inserted.length > 0 && referredByUserId) {
      const paid = await recordReferralSignupRewardTx(tx, {
        referrerUserId: referredByUserId,
        refereeUserId: authUser.id,
      });
      if (paid) {
        referralGrant.current = {
          referrerId: referredByUserId,
          refereeId: authUser.id,
        };
      }
    }

    return created ?? null;
  });

  const logPayload = referralGrant.current;
  if (logPayload) {
    void logActivity({
      userId: logPayload.referrerId,
      eventType: "referral_reward",
      page: "/api/auth/callback",
      metadata: {
        refereeUserId: logPayload.refereeId,
        points: REFERRAL_SYSTEM.REFERRER_POINTS,
      },
    });
  }

  return row;
}
