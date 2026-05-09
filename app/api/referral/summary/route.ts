import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { referralRewards, users } from "@/db/schema";
import { REFERRAL_SYSTEM } from "@/constants";
import { getServerUser } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit-db";
import { logger } from "@/lib/logger";

/**
 * Oturum açmış kullanıcının davet kodu, bağlantısı ve başarılı davet sayısı.
 */
export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit({
    key: `referral-summary:user:${user.id}`,
    ...RATE_LIMITS.read,
  });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const row = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { referralCode: true },
    });
    if (!row?.referralCode) {
      return NextResponse.json({ ok: false, error: "no_profile" }, { status: 404 });
    }

    let successfulInvites = 0;
    try {
      const [agg] = await db
        .select({ c: count(referralRewards.id) })
        .from(referralRewards)
        .where(eq(referralRewards.referrerUserId, user.id));
      successfulInvites = Number(agg?.c ?? 0);
    } catch (countErr) {
      // Eksik tablo / geçici DB: davet bağlantısı yine de dönsün; sayaç 0.
      logger.warn("referral_rewards count failed; returning successfulInvites=0", {
        error: countErr instanceof Error ? countErr.message : String(countErr),
        location: "api/referral/summary/GET/count",
        userId: user.id,
      });
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "");

    const inviteUrl =
      origin.length > 0
        ? `${origin}/create-account?ref=${encodeURIComponent(row.referralCode)}`
        : `/create-account?ref=${encodeURIComponent(row.referralCode)}`;

    return NextResponse.json({
      ok: true,
      code: row.referralCode,
      inviteUrl,
      successfulInvites,
      referrerRewardPoints: REFERRAL_SYSTEM.REFERRER_POINTS,
    });
  } catch (error) {
    logger.error({
      message: "referral summary failed",
      error,
      location: "api/referral/summary/GET",
      userId: user.id,
    });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
