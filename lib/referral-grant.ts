import { and, eq, sql } from "drizzle-orm";

import db from "@/db/drizzle";
import { REFERRAL_SYSTEM } from "@/constants";
import { referralRewards, schools, userProgress, users } from "@/db/schema";
import { logActivity } from "@/lib/activity-logger";
import { logger } from "@/lib/logger";
import { mintReferralCodeCandidate, normalizeRefereeEmail } from "@/lib/referral-code";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const log = logger.child({ labels: { module: "referral-grant" } });

export async function allocateUniqueReferralCode(tx: Tx): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const code = mintReferralCodeCandidate();
    const clash = await tx.query.users.findFirst({
      where: eq(users.referralCode, code),
      columns: { id: true },
    });
    if (!clash) return code;
  }
  throw new Error("referral_code_allocation_exhausted");
}

export async function allocateUniqueReferralCodeStandalone(): Promise<string> {
  return db.transaction(async (tx) => allocateUniqueReferralCode(tx));
}

/**
 * Yeni davetli için: yönlendirene puan + okul özeti + tek seferlik ödül kaydı.
 * Idempotent: aynı `(referrer, davetli e-posta)` veya aynı `refereeUserId` ikinci kez ödül vermez.
 */
export async function recordReferralSignupRewardTx(
  tx: Tx,
  input: {
    referrerUserId: string;
    refereeUserId: string;
    refereeEmail: string;
  },
): Promise<boolean> {
  const { referrerUserId, refereeUserId } = input;
  const refereeEmailNormalized = normalizeRefereeEmail(input.refereeEmail);
  const pts = REFERRAL_SYSTEM.REFERRER_POINTS;
  if (pts <= 0 || !refereeEmailNormalized) return false;

  const refProg = await tx.query.userProgress.findFirst({
    where: eq(userProgress.userId, referrerUserId),
    columns: { points: true, dailyPointsEarned: true, schoolId: true },
  });

  if (!refProg) {
    log.warn("referrer has no user_progress; referral reward deferred", {
      referrerUserId,
      refereeUserId,
      refereeEmailNormalized,
    });
    return false;
  }

  const priorClaim = await tx.query.referralRewards.findFirst({
    where: and(
      eq(referralRewards.referrerUserId, referrerUserId),
      eq(referralRewards.refereeEmailNormalized, refereeEmailNormalized),
    ),
    columns: { id: true },
  });
  if (priorClaim) {
    return false;
  }

  const inserted = await tx
    .insert(referralRewards)
    .values({
      referrerUserId,
      refereeUserId,
      refereeEmailNormalized,
      referrerPoints: pts,
    })
    .onConflictDoNothing({
      target: [
        referralRewards.referrerUserId,
        referralRewards.refereeEmailNormalized,
      ],
    })
    .returning({ id: referralRewards.id });

  if (inserted.length === 0) {
    return false;
  }

  const newPoints = refProg.points + pts;
  const newDaily = Math.max(0, (refProg.dailyPointsEarned ?? 0) + pts);

  await tx
    .update(userProgress)
    .set({
      points: newPoints,
      dailyPointsEarned: newDaily,
    })
    .where(eq(userProgress.userId, referrerUserId));

  if (refProg.schoolId) {
    await tx
      .update(schools)
      .set({
        totalPoints: sql`${schools.totalPoints} + ${pts}`,
      })
      .where(eq(schools.id, refProg.schoolId));
  }

  return true;
}

/**
 * Davet eden daha önce `user_progress` oluşturmamışsa ödül ertelenir; ilk
 * onboarding tamamlandığında burada yeniden denenir (idempotent).
 */
export async function flushDeferredReferralRewardsForReferrer(
  referrerUserId: string,
): Promise<void> {
  const grantedReferees = await db.transaction(async (tx) => {
    const granted: string[] = [];

    const prog = await tx.query.userProgress.findFirst({
      where: eq(userProgress.userId, referrerUserId),
      columns: { userId: true },
    });
    if (!prog) return granted;

    const referees = await tx.query.users.findMany({
      where: eq(users.referredByUserId, referrerUserId),
      columns: { id: true, email: true },
    });

    for (const { id: refereeUserId, email } of referees) {
      const ok = await recordReferralSignupRewardTx(tx, {
        referrerUserId,
        refereeUserId,
        refereeEmail: email,
      });
      if (ok) granted.push(refereeUserId);
    }

    return granted;
  });

  for (const refereeUserId of grantedReferees) {
    void logActivity({
      userId: referrerUserId,
      eventType: "referral_reward",
      page: "/onboarding",
      metadata: {
        refereeUserId,
        points: REFERRAL_SYSTEM.REFERRER_POINTS,
        deferred: true,
      },
    });
  }
}
