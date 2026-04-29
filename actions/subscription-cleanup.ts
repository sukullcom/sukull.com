import { and, eq, isNotNull, lt } from "drizzle-orm";

import db from "@/db/drizzle";
import { userProgress, userSubscriptions } from "@/db/schema";

/**
 * Sonsuz can aboneliği süresi dolmuş satırları toplu düzeltir.
 *
 * `getUserProgress` / `checkSubscriptionStatus` zaten aynı mantığı
 * istek başına uygular; bu iş günlük cron ile yedek (admin sorguları,
 * doğrudan DB okuyan nadir yollar, ileride eklenecek raporlar) tutarlılığı
 * korur.
 */
export async function expireStaleInfiniteHeartsSubscriptions(): Promise<{
  expiredSubscriptions: number;
  clearedProgressFlags: number;
}> {
  const now = new Date();

  return await db.transaction(async (tx) => {
    const subs = await tx
      .update(userSubscriptions)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(
          eq(userSubscriptions.status, "active"),
          lt(userSubscriptions.endDate, now),
        ),
      )
      .returning({ id: userSubscriptions.id });

    const progress = await tx
      .update(userProgress)
      .set({
        hasInfiniteHearts: false,
        subscriptionExpiresAt: null,
      })
      .where(
        and(
          eq(userProgress.hasInfiniteHearts, true),
          isNotNull(userProgress.subscriptionExpiresAt),
          lt(userProgress.subscriptionExpiresAt, now),
        ),
      )
      .returning({ userId: userProgress.userId });

    return {
      expiredSubscriptions: subs.length,
      clearedProgressFlags: progress.length,
    };
  });
}
