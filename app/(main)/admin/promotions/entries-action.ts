"use server";

import { getAdminActor } from "@/lib/admin";
import {
  listPromotionEntriesForAdmin,
  type PromotionEntryDetail,
} from "@/lib/promotions";

export interface AdminEntriesResult {
  ok: boolean;
  entries?: PromotionEntryDetail[];
  error?: "unauthorized" | "internal";
}

/**
 * Pulls katılımcı listesi for the admin entries dialog. Returns up to 500
 * rows by default; the dialog warns the admin when the list is truncated.
 *
 * Wrapped as a server action so the client island can fetch on demand
 * without baking every promotion's entries into the initial page payload.
 */
export async function loadPromotionEntries(
  promotionId: number,
): Promise<AdminEntriesResult> {
  if (!Number.isFinite(promotionId) || promotionId <= 0) {
    return { ok: false, error: "unauthorized" };
  }
  const actor = await getAdminActor();
  if (!actor) return { ok: false, error: "unauthorized" };

  try {
    const entries = await listPromotionEntriesForAdmin(promotionId, 500);
    return { ok: true, entries };
  } catch {
    return { ok: false, error: "internal" };
  }
}
