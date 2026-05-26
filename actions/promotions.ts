"use server";

import { revalidatePath } from "next/cache";

import { getServerUser } from "@/lib/auth";
import { recordPromotionEntry } from "@/lib/promotions";
import { logger } from "@/lib/logger";

const log = logger.child({ labels: { module: "actions/promotions" } });

export interface JoinPromotionResult {
  ok: boolean;
  joined?: boolean;
  alreadyJoined?: boolean;
  participantCount?: number;
  error?: "unauthenticated" | "not_found" | "not_live" | "internal";
}

/**
 * Server action invoked by the banner's "Çekilişe Katıl" button. We require
 * an authenticated user (protected layout already enforces this; double-
 * checking here keeps the action safe if it's ever called from a non-
 * protected route) and then delegate to `recordPromotionEntry` which is
 * idempotent.
 *
 * The banner is server-rendered and refreshes via `revalidatePath('/learn')`
 * on success so the counter updates without a full reload; the client also
 * patches the count optimistically.
 */
export async function joinPromotion(
  promotionId: number,
): Promise<JoinPromotionResult> {
  if (!Number.isFinite(promotionId) || promotionId <= 0) {
    return { ok: false, error: "not_found" };
  }

  const user = await getServerUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }

  try {
    const result = await recordPromotionEntry({
      promotionId,
      userId: user.id,
    });
    if (!result.ok) {
      return { ok: false, error: result.reason };
    }
    revalidatePath("/learn");
    return {
      ok: true,
      joined: true,
      alreadyJoined: result.alreadyJoined,
      participantCount: result.participantCount,
    };
  } catch (err) {
    log.error({
      message: "joinPromotion failed",
      error: err,
      location: "actions/promotions/joinPromotion",
      userId: user.id,
      fields: { promotionId },
    });
    return { ok: false, error: "internal" };
  }
}
