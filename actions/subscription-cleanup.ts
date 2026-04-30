import { and, eq, inArray, isNotNull, lt } from "drizzle-orm";

import db from "@/db/drizzle";
import { userProgress, userSubscriptions } from "@/db/schema";

const BATCH = 5000;
const MAX_LOOPS = 100;

/**
 * Sonsuz can aboneliği süresi dolmuş satırları toplu düzeltir.
 *
 * `getUserProgress` / `checkSubscriptionStatus` zaten aynı mantığı
 * istek başına uygular; bu iş günlük cron ile yedek (admin sorguları,
 * doğrudan DB okuyan nadir yollar, ileride eklenecek raporlar) tutarlılığı
 * korur.
 *
 * Büyük tabloda tek `UPDATE … WHERE` uzun süre kilit tutmaması için
 * parti parti işlenir.
 */
export async function expireStaleInfiniteHeartsSubscriptions(): Promise<{
  expiredSubscriptions: number;
  clearedProgressFlags: number;
}> {
  const now = new Date();

  return await db.transaction(async (tx) => {
    let expiredSubscriptions = 0;
    for (let i = 0; i < MAX_LOOPS; i++) {
      const batch = await tx
        .select({ id: userSubscriptions.id })
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.status, "active"),
            lt(userSubscriptions.endDate, now),
          ),
        )
        .limit(BATCH);
      if (batch.length === 0) break;
      const updated = await tx
        .update(userSubscriptions)
        .set({ status: "expired", updatedAt: now })
        .where(inArray(userSubscriptions.id, batch.map((r) => r.id)))
        .returning({ id: userSubscriptions.id });
      expiredSubscriptions += updated.length;
      if (batch.length < BATCH) break;
    }

    let clearedProgressFlags = 0;
    for (let i = 0; i < MAX_LOOPS; i++) {
      const batch = await tx
        .select({ userId: userProgress.userId })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.hasInfiniteHearts, true),
            isNotNull(userProgress.subscriptionExpiresAt),
            lt(userProgress.subscriptionExpiresAt, now),
          ),
        )
        .limit(BATCH);
      if (batch.length === 0) break;
      const updated = await tx
        .update(userProgress)
        .set({
          hasInfiniteHearts: false,
          subscriptionExpiresAt: null,
        })
        .where(inArray(userProgress.userId, batch.map((r) => r.userId)))
        .returning({ userId: userProgress.userId });
      clearedProgressFlags += updated.length;
      if (batch.length < BATCH) break;
    }

    return {
      expiredSubscriptions,
      clearedProgressFlags,
    };
  });
}
