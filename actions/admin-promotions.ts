"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { promotions } from "@/db/schema";
import { getAdminActor, isAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/admin-audit";
import {
  type PromotionAccent,
  PROMOTION_ACCENTS,
  clearWinner as clearWinnerDb,
  isPromotionAccent,
  pickRandomWinner as pickRandomWinnerDb,
} from "@/lib/promotions";
import { logger } from "@/lib/logger";

const log = logger.child({ labels: { module: "actions/admin-promotions" } });

/**
 * Wire format used by the admin "yeni çekiliş" form. Dates arrive as ISO
 * strings; we parse + validate here so the action layer is the single
 * defence against bad input.
 */
export interface AdminPromotionFormInput {
  kind?: string;
  title: string;
  description?: string | null;
  prize: string;
  ctaLabel?: string | null;
  rules?: string | null;
  accentColor?: string | null;
  imageUrl?: string | null;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

export interface AdminPromotionResult {
  ok: boolean;
  id?: number;
  error?:
    | "unauthorized"
    | "validation"
    | "not_found"
    | "internal";
  /** Field → reason map populated when `error === "validation"`. */
  fieldErrors?: Record<string, string>;
}

const MAX_TITLE_LEN = 120;
const MAX_PRIZE_LEN = 200;
const MAX_DESCRIPTION_LEN = 2000;
const MAX_RULES_LEN = 4000;
const MAX_CTA_LEN = 60;
const MAX_IMAGE_LEN = 500;
const MAX_KIND_LEN = 40;
const MAX_FUTURE_YEARS = 5;

function validateInput(input: AdminPromotionFormInput): {
  ok: true;
  value: {
    kind: string;
    title: string;
    description: string | null;
    prize: string;
    ctaLabel: string;
    rules: string | null;
    accentColor: PromotionAccent;
    imageUrl: string | null;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
  };
} | {
  ok: false;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};

  const title = String(input.title ?? "").trim();
  if (!title) fieldErrors.title = "Başlık zorunlu";
  else if (title.length > MAX_TITLE_LEN)
    fieldErrors.title = `En fazla ${MAX_TITLE_LEN} karakter`;

  const prize = String(input.prize ?? "").trim();
  if (!prize) fieldErrors.prize = "Ödül zorunlu";
  else if (prize.length > MAX_PRIZE_LEN)
    fieldErrors.prize = `En fazla ${MAX_PRIZE_LEN} karakter`;

  const description = input.description?.toString().trim() ?? "";
  if (description.length > MAX_DESCRIPTION_LEN)
    fieldErrors.description = `En fazla ${MAX_DESCRIPTION_LEN} karakter`;

  const rules = input.rules?.toString().trim() ?? "";
  if (rules.length > MAX_RULES_LEN)
    fieldErrors.rules = `En fazla ${MAX_RULES_LEN} karakter`;

  const ctaLabel = (input.ctaLabel?.toString().trim() || "Çekilişe Katıl");
  if (ctaLabel.length > MAX_CTA_LEN)
    fieldErrors.ctaLabel = `En fazla ${MAX_CTA_LEN} karakter`;

  const kind = (input.kind?.toString().trim() || "giveaway").toLowerCase();
  if (kind.length > MAX_KIND_LEN || !/^[a-z0-9_-]+$/.test(kind))
    fieldErrors.kind = "Sadece harf/rakam/_-";

  const imageUrl = input.imageUrl?.toString().trim() || null;
  if (imageUrl && imageUrl.length > MAX_IMAGE_LEN)
    fieldErrors.imageUrl = `En fazla ${MAX_IMAGE_LEN} karakter`;
  if (imageUrl && !/^(\/|https?:\/\/)/i.test(imageUrl)) {
    fieldErrors.imageUrl = "Yol /icon.svg veya https://...";
  }

  const accentRaw = (input.accentColor ?? "violet").toString();
  const accentColor: PromotionAccent = isPromotionAccent(accentRaw)
    ? accentRaw
    : "violet";

  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt);
  const maxFuture = new Date();
  maxFuture.setUTCFullYear(maxFuture.getUTCFullYear() + MAX_FUTURE_YEARS);

  if (!startsAt) fieldErrors.startsAt = "Başlangıç tarihi geçersiz";
  if (!endsAt) fieldErrors.endsAt = "Bitiş tarihi geçersiz";
  if (startsAt && endsAt && endsAt <= startsAt)
    fieldErrors.endsAt = "Bitiş, başlangıçtan sonra olmalı";
  if (endsAt && endsAt > maxFuture)
    fieldErrors.endsAt = `En fazla ${MAX_FUTURE_YEARS} yıl ileride olabilir`;

  if (Object.keys(fieldErrors).length > 0 || !startsAt || !endsAt) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    value: {
      kind,
      title,
      description: description || null,
      prize,
      ctaLabel,
      rules: rules || null,
      accentColor,
      imageUrl,
      startsAt,
      endsAt,
      isActive: input.isActive !== false,
    },
  };
}

function parseDate(input: unknown): Date | null {
  if (input == null) return null;
  if (input instanceof Date) {
    return Number.isFinite(input.getTime()) ? input : null;
  }
  const d = new Date(String(input));
  return Number.isFinite(d.getTime()) ? d : null;
}

async function requireAdminActor(): Promise<
  | { ok: true; actor: { id: string; email: string | null } }
  | { ok: false }
> {
  const actor = await getAdminActor();
  if (!actor) return { ok: false };
  return { ok: true, actor };
}

export async function createPromotion(
  input: AdminPromotionFormInput,
): Promise<AdminPromotionResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return { ok: false, error: "unauthorized" };

  const validated = validateInput(input);
  if (!validated.ok) {
    return { ok: false, error: "validation", fieldErrors: validated.fieldErrors };
  }

  try {
    const [row] = await db
      .insert(promotions)
      .values({
        kind: validated.value.kind,
        title: validated.value.title,
        description: validated.value.description,
        prize: validated.value.prize,
        ctaLabel: validated.value.ctaLabel,
        rules: validated.value.rules,
        accentColor: validated.value.accentColor,
        imageUrl: validated.value.imageUrl,
        startsAt: validated.value.startsAt,
        endsAt: validated.value.endsAt,
        isActive: validated.value.isActive,
        createdBy: gate.actor.id,
      })
      .returning({ id: promotions.id });

    await logAdminAction({
      actorId: gate.actor.id,
      actorEmail: gate.actor.email,
      action: "promotion.create",
      targetType: "promotion",
      targetId: row.id,
      metadata: {
        kind: validated.value.kind,
        title: validated.value.title,
        startsAt: validated.value.startsAt.toISOString(),
        endsAt: validated.value.endsAt.toISOString(),
        isActive: validated.value.isActive,
      },
    });

    revalidatePath("/admin/promotions");
    revalidatePath("/learn");
    return { ok: true, id: row.id };
  } catch (err) {
    log.error({
      message: "createPromotion failed",
      error: err,
      location: "actions/admin-promotions/createPromotion",
      userId: gate.actor.id,
    });
    return { ok: false, error: "internal" };
  }
}

export async function updatePromotion(
  id: number,
  input: AdminPromotionFormInput,
): Promise<AdminPromotionResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return { ok: false, error: "unauthorized" };

  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, error: "not_found" };
  }

  const validated = validateInput(input);
  if (!validated.ok) {
    return { ok: false, error: "validation", fieldErrors: validated.fieldErrors };
  }

  try {
    const updated = await db
      .update(promotions)
      .set({
        kind: validated.value.kind,
        title: validated.value.title,
        description: validated.value.description,
        prize: validated.value.prize,
        ctaLabel: validated.value.ctaLabel,
        rules: validated.value.rules,
        accentColor: validated.value.accentColor,
        imageUrl: validated.value.imageUrl,
        startsAt: validated.value.startsAt,
        endsAt: validated.value.endsAt,
        isActive: validated.value.isActive,
      })
      .where(eq(promotions.id, id))
      .returning({ id: promotions.id });

    if (updated.length === 0) {
      return { ok: false, error: "not_found" };
    }

    await logAdminAction({
      actorId: gate.actor.id,
      actorEmail: gate.actor.email,
      action: "promotion.update",
      targetType: "promotion",
      targetId: id,
      metadata: {
        title: validated.value.title,
        isActive: validated.value.isActive,
      },
    });

    revalidatePath("/admin/promotions");
    revalidatePath("/learn");
    return { ok: true, id };
  } catch (err) {
    log.error({
      message: "updatePromotion failed",
      error: err,
      location: "actions/admin-promotions/updatePromotion",
      userId: gate.actor.id,
      fields: { promotionId: id },
    });
    return { ok: false, error: "internal" };
  }
}

export async function deletePromotion(id: number): Promise<AdminPromotionResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return { ok: false, error: "unauthorized" };

  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, error: "not_found" };
  }

  try {
    const deleted = await db
      .delete(promotions)
      .where(eq(promotions.id, id))
      .returning({ id: promotions.id });

    if (deleted.length === 0) return { ok: false, error: "not_found" };

    await logAdminAction({
      actorId: gate.actor.id,
      actorEmail: gate.actor.email,
      action: "promotion.delete",
      targetType: "promotion",
      targetId: id,
    });

    revalidatePath("/admin/promotions");
    revalidatePath("/learn");
    return { ok: true, id };
  } catch (err) {
    log.error({
      message: "deletePromotion failed",
      error: err,
      location: "actions/admin-promotions/deletePromotion",
      userId: gate.actor.id,
      fields: { promotionId: id },
    });
    return { ok: false, error: "internal" };
  }
}

export async function togglePromotionActive(
  id: number,
  nextActive: boolean,
): Promise<AdminPromotionResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return { ok: false, error: "unauthorized" };

  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, error: "not_found" };
  }

  try {
    const updated = await db
      .update(promotions)
      .set({ isActive: nextActive })
      .where(eq(promotions.id, id))
      .returning({ id: promotions.id });

    if (updated.length === 0) return { ok: false, error: "not_found" };

    await logAdminAction({
      actorId: gate.actor.id,
      actorEmail: gate.actor.email,
      action: "promotion.toggle_active",
      targetType: "promotion",
      targetId: id,
      metadata: { isActive: nextActive },
    });

    revalidatePath("/admin/promotions");
    revalidatePath("/learn");
    return { ok: true, id };
  } catch (err) {
    log.error({
      message: "togglePromotionActive failed",
      error: err,
      location: "actions/admin-promotions/togglePromotionActive",
      userId: gate.actor.id,
      fields: { promotionId: id, nextActive },
    });
    return { ok: false, error: "internal" };
  }
}

export interface PickWinnerActionResult {
  ok: boolean;
  winnerUserId?: string;
  winnerName?: string | null;
  winnerEmail?: string | null;
  pickedAt?: string;
  error?: "unauthorized" | "no_entries" | "not_found" | "internal";
}

export async function pickPromotionWinner(
  id: number,
): Promise<PickWinnerActionResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return { ok: false, error: "unauthorized" };

  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, error: "not_found" };
  }

  try {
    const winner = await pickRandomWinnerDb(id);
    if (!winner) return { ok: false, error: "no_entries" };

    await logAdminAction({
      actorId: gate.actor.id,
      actorEmail: gate.actor.email,
      action: "promotion.pick_winner",
      targetType: "promotion",
      targetId: id,
      metadata: {
        winnerUserId: winner.winnerUserId,
        winnerEmail: winner.winnerEmail,
      },
    });

    revalidatePath("/admin/promotions");
    revalidatePath("/learn");
    return { ok: true, ...winner };
  } catch (err) {
    log.error({
      message: "pickPromotionWinner failed",
      error: err,
      location: "actions/admin-promotions/pickPromotionWinner",
      userId: gate.actor.id,
      fields: { promotionId: id },
    });
    return { ok: false, error: "internal" };
  }
}

export async function clearPromotionWinner(
  id: number,
): Promise<AdminPromotionResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return { ok: false, error: "unauthorized" };
  if (!Number.isFinite(id) || id <= 0) return { ok: false, error: "not_found" };

  try {
    await clearWinnerDb(id);
    await logAdminAction({
      actorId: gate.actor.id,
      actorEmail: gate.actor.email,
      action: "promotion.clear_winner",
      targetType: "promotion",
      targetId: id,
    });
    revalidatePath("/admin/promotions");
    revalidatePath("/learn");
    return { ok: true, id };
  } catch (err) {
    log.error({
      message: "clearPromotionWinner failed",
      error: err,
      location: "actions/admin-promotions/clearPromotionWinner",
      userId: gate.actor.id,
      fields: { promotionId: id },
    });
    return { ok: false, error: "internal" };
  }
}

export const PROMOTION_ACCENT_CHOICES = PROMOTION_ACCENTS;

/**
 * Re-export for the admin UI (`is admin?` quick check inside Server
 * Components / loaders that need to gate optional UI).
 */
export async function checkIsAdmin(): Promise<boolean> {
  return (await isAdmin()) === true;
}
