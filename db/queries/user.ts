/**
 * User-scoped queries: profile/hearts, credits and subscriptions.
 *
 * `getUserProgress` is the hottest path in the app (called from virtually
 * every protected render). Every avoidable round-trip here multiplies
 * by total page-views.
 */
import { cache } from "react";
import { and, desc, eq, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import {
  userProgress,
  userSubscriptions,
  userCredits,
  creditTransactions,
} from "@/db/schema";
import { getServerUser } from "@/lib/auth";
import { normalizeAvatarUrl } from "@/utils/avatar";
import { HEART_MAX, HEART_REGEN_INTERVAL_MS } from "./shared";

/**
 * Design:
 *   • ONE read of `user_progress` per request (cached across the request
 *     via React's `cache()`).
 *   • Subscription-expired reset is folded in-line: no separate
 *     `checkSubscriptionStatus(userId)` read when we already have `data`.
 *   • Heart regen WRITE only fires when hearts actually change or when
 *     we anchor the regen timer for the first time. The common case
 *     (hearts full, or < 4h since last regen) performs zero writes.
 */
export const getUserProgress = cache(async () => {
  const user = await getServerUser();
  if (!user) {
    return null;
  }
  const userId = user.id;

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: true,
    },
  });

  if (!data) return null;

  const now = new Date();

  if (
    data.hasInfiniteHearts &&
    data.subscriptionExpiresAt &&
    data.subscriptionExpiresAt < now
  ) {
    await Promise.all([
      db
        .update(userProgress)
        .set({ hasInfiniteHearts: false, subscriptionExpiresAt: null })
        .where(eq(userProgress.userId, userId)),
      db
        .update(userSubscriptions)
        .set({ status: "expired", updatedAt: now })
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, "active"),
          ),
        ),
    ]);
    data.hasInfiniteHearts = false;
    data.subscriptionExpiresAt = null;
  }

  if (data.hearts < HEART_MAX && !data.hasInfiniteHearts) {
    if (!data.lastHeartRegenAt) {
      await db
        .update(userProgress)
        .set({ lastHeartRegenAt: now })
        .where(eq(userProgress.userId, userId));
      data.lastHeartRegenAt = now;
    } else {
      const elapsed = now.getTime() - new Date(data.lastHeartRegenAt).getTime();
      const heartsToAdd = Math.floor(elapsed / HEART_REGEN_INTERVAL_MS);

      if (heartsToAdd > 0) {
        const newHearts = Math.min(data.hearts + heartsToAdd, HEART_MAX);
        await db
          .update(userProgress)
          .set({ hearts: newHearts, lastHeartRegenAt: now })
          .where(eq(userProgress.userId, userId));
        data.hearts = newHearts;
        data.lastHeartRegenAt = now;
      }
    }
  }

  return {
    ...data,
    userImageSrc: normalizeAvatarUrl(data.userImageSrc),
  };
});

export const getUserCredits = cache(async (userId: string) => {
  const credits = await db.query.userCredits.findFirst({
    where: eq(userCredits.userId, userId),
  });

  return (
    credits || {
      totalCredits: 0,
      usedCredits: 0,
      availableCredits: 0,
    }
  );
});

export const useCredit = async (userId: string) => {
  const result = await db
    .update(userCredits)
    .set({
      usedCredits: sql`${userCredits.usedCredits} + 1`,
      availableCredits: sql`${userCredits.availableCredits} - 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userCredits.userId, userId),
        sql`${userCredits.availableCredits} >= 1`,
      ),
    )
    .returning();

  if (result.length === 0) {
    throw new Error("Yetersiz kredi");
  }
};

export const refundCredit = async (userId: string) => {
  const result = await db
    .update(userCredits)
    .set({
      usedCredits: sql`GREATEST(${userCredits.usedCredits} - 1, 0)`,
      availableCredits: sql`${userCredits.availableCredits} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(userCredits.userId, userId))
    .returning();

  if (result.length === 0) {
    throw new Error("Kullanıcı kredi bilgisi bulunamadı");
  }
};

export const getUserCreditTransactions = cache(async (userId: string) => {
  return await db.query.creditTransactions.findMany({
    where: eq(creditTransactions.userId, userId),
    orderBy: desc(creditTransactions.createdAt),
  });
});

export const hasAvailableCredits = async (
  userId: string,
  requiredCredits: number = 1,
) => {
  const credits = await db.query.userCredits.findFirst({
    where: eq(userCredits.userId, userId),
  });
  return (credits?.availableCredits ?? 0) >= requiredCredits;
};

/**
 * Standalone subscription-expiry check. Prefer `getUserProgress()` when the
 * caller needs the whole user row; this exists for callers that only care
 * about the boolean (middleware, admin tooling).
 */
export const checkSubscriptionStatus = async (userId: string) => {
  const now = new Date();

  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!progress) return false;

  if (
    progress.hasInfiniteHearts &&
    progress.subscriptionExpiresAt &&
    progress.subscriptionExpiresAt < now
  ) {
    await db
      .update(userProgress)
      .set({
        hasInfiniteHearts: false,
        subscriptionExpiresAt: null,
      })
      .where(eq(userProgress.userId, userId));

    await db
      .update(userSubscriptions)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, "active"),
        ),
      );

    return false;
  }

  return progress.hasInfiniteHearts || false;
};

export const getUserSubscription = cache(async (userId: string) => {
  const subscription = await db.query.userSubscriptions.findFirst({
    where: and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, "active"),
    ),
    orderBy: desc(userSubscriptions.createdAt),
  });

  return subscription;
});

export const createSubscription = async (userId: string, paymentId: string) => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  const subscription = await db
    .insert(userSubscriptions)
    .values({
      userId,
      subscriptionType: "infinite_hearts",
      status: "active",
      startDate: now,
      endDate,
      paymentId,
      amount: "100",
      currency: "TRY",
    })
    .returning();

  await db
    .update(userProgress)
    .set({
      hasInfiniteHearts: true,
      subscriptionExpiresAt: endDate,
    })
    .where(eq(userProgress.userId, userId));

  return subscription[0];
};

export const getUserSubscriptionHistory = cache(async (userId: string) => {
  return await db.query.userSubscriptions.findMany({
    where: eq(userSubscriptions.userId, userId),
    orderBy: desc(userSubscriptions.createdAt),
  });
});
