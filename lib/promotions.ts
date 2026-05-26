import "server-only";

import { cache } from "react";
import { and, count, desc, eq, lte, gte, sql, inArray } from "drizzle-orm";

import db from "@/db/drizzle";
import { promotions, promotionEntries } from "@/db/schema";
import { getServerUser } from "@/lib/auth";
import { queryResultRows } from "@/lib/query-result";

// Accent presets live in a client-safe module so client components can
// consume them as plain values. We re-export here for server-side
// convenience (admin loaders, validation, etc.).
import {
  PROMOTION_ACCENTS,
  PROMOTION_ACCENT_CHOICES,
  isPromotionAccent,
  type PromotionAccent,
} from "@/lib/promotion-accents";

export {
  PROMOTION_ACCENTS,
  PROMOTION_ACCENT_CHOICES,
  isPromotionAccent,
  type PromotionAccent,
};

export type PromotionRow = typeof promotions.$inferSelect;

export interface ActivePromotion {
  id: number;
  kind: string;
  title: string;
  description: string | null;
  prize: string;
  ctaLabel: string;
  rules: string | null;
  accentColor: PromotionAccent;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string;
  /** Server-side snapshot — the client recomputes locally each second. */
  secondsRemaining: number;
  participantCount: number;
  joined: boolean;
  /** Already drawn? Once a winner is picked the banner shows result mode. */
  winnerSelected: boolean;
}

function normaliseAccent(value: string | null | undefined): PromotionAccent {
  return isPromotionAccent(value) ? value : "violet";
}

/**
 * Returns every currently-live promotion ordered by most-recently-starting
 * first, annotated with participant counts and the caller's join state.
 *
 * "Live" = `is_active = true AND now() BETWEEN starts_at AND ends_at`. We
 * intentionally still expose rows where a winner has already been selected
 * during the window so the banner can flip to a result view; the moment
 * `ends_at` passes, the row drops out.
 *
 * Reads are React-cached per request: the protected layout and the learn
 * page both pull this, and Next dedupes through `cache()`.
 */
export const getActivePromotionsForCurrentUser = cache(
  async (): Promise<ActivePromotion[]> => {
    const user = await getServerUser();
    if (!user) return [];

    const now = new Date();

    const rows = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.isActive, true),
          lte(promotions.startsAt, now),
          gte(promotions.endsAt, now),
        ),
      )
      .orderBy(desc(promotions.startsAt));

    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.id);

    // Two cheap aggregates in parallel beat a JOIN here because both
    // queries hit the same partial index on promotion_id and we avoid
    // pulling the user_id column for the count case.
    const [countsByPromotion, myEntries] = await Promise.all([
      db
        .select({
          promotionId: promotionEntries.promotionId,
          value: count(),
        })
        .from(promotionEntries)
        .where(inArray(promotionEntries.promotionId, ids))
        .groupBy(promotionEntries.promotionId),
      db
        .select({ promotionId: promotionEntries.promotionId })
        .from(promotionEntries)
        .where(
          and(
            inArray(promotionEntries.promotionId, ids),
            eq(promotionEntries.userId, user.id),
          ),
        ),
    ]);

    const countMap = new Map<number, number>();
    for (const row of countsByPromotion) {
      countMap.set(row.promotionId, Number(row.value ?? 0));
    }

    const joinedSet = new Set<number>();
    for (const row of myEntries) {
      joinedSet.add(row.promotionId);
    }

    return rows.map((row) => mapRowToActive(row, {
      participantCount: countMap.get(row.id) ?? 0,
      joined: joinedSet.has(row.id),
      now,
    }));
  },
);

function mapRowToActive(
  row: PromotionRow,
  ctx: { participantCount: number; joined: boolean; now: Date },
): ActivePromotion {
  const endsAt = row.endsAt instanceof Date ? row.endsAt : new Date(row.endsAt);
  const startsAt = row.startsAt instanceof Date ? row.startsAt : new Date(row.startsAt);
  const secondsRemaining = Math.max(
    0,
    Math.floor((endsAt.getTime() - ctx.now.getTime()) / 1000),
  );
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    prize: row.prize,
    ctaLabel: row.ctaLabel,
    rules: row.rules,
    accentColor: normaliseAccent(row.accentColor),
    imageUrl: row.imageUrl,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    secondsRemaining,
    participantCount: ctx.participantCount,
    joined: ctx.joined,
    winnerSelected: !!row.winnerUserId,
  };
}

/**
 * Inserts a single entry (idempotent via ON CONFLICT DO NOTHING). Caller is
 * expected to verify auth + that the promotion is currently live; we still
 * re-check the live window inside the same transaction to defend against
 * race conditions where an admin closes a promotion between read and write.
 *
 * Returns the resulting state so callers can patch UI optimistically.
 */
export async function recordPromotionEntry(opts: {
  promotionId: number;
  userId: string;
}): Promise<
  | { ok: true; joined: true; participantCount: number; alreadyJoined: boolean }
  | { ok: false; reason: "not_found" | "not_live" }
> {
  const promo = await db.query.promotions.findFirst({
    where: eq(promotions.id, opts.promotionId),
  });
  if (!promo) return { ok: false, reason: "not_found" };

  const now = new Date();
  if (!promo.isActive || promo.startsAt > now || promo.endsAt < now) {
    return { ok: false, reason: "not_live" };
  }

  // Track whether the unique constraint kicked in so the UI can show
  // "already participating" vs "just joined" without a second round-trip.
  const inserted = await db
    .insert(promotionEntries)
    .values({
      promotionId: opts.promotionId,
      userId: opts.userId,
    })
    .onConflictDoNothing({
      target: [promotionEntries.promotionId, promotionEntries.userId],
    })
    .returning({ id: promotionEntries.id });

  const [{ value }] = await db
    .select({ value: count() })
    .from(promotionEntries)
    .where(eq(promotionEntries.promotionId, opts.promotionId));

  return {
    ok: true,
    joined: true,
    participantCount: Number(value ?? 0),
    alreadyJoined: inserted.length === 0,
  };
}

// =============================================================================
// Admin helpers
// =============================================================================

export interface AdminPromotionInput {
  kind?: string;
  title: string;
  description?: string | null;
  prize: string;
  ctaLabel?: string;
  rules?: string | null;
  accentColor?: PromotionAccent;
  imageUrl?: string | null;
  startsAt: Date;
  endsAt: Date;
  isActive?: boolean;
}

export interface AdminPromotionRowWithCounts extends PromotionRow {
  participantCount: number;
}

/**
 * Lists every promotion (active, scheduled, ended) with entry counts. Used by
 * the admin index page; intentionally not cached so the count is always
 * fresh after a join.
 */
export async function listPromotionsForAdmin(): Promise<AdminPromotionRowWithCounts[]> {
  const rows = await db
    .select({
      promo: promotions,
      participantCount: sql<number>`COALESCE(COUNT(${promotionEntries.id}), 0)`,
    })
    .from(promotions)
    .leftJoin(promotionEntries, eq(promotionEntries.promotionId, promotions.id))
    .groupBy(promotions.id)
    .orderBy(desc(promotions.createdAt));

  return rows.map(({ promo, participantCount }) => ({
    ...promo,
    participantCount: Number(participantCount ?? 0),
  }));
}

export async function getPromotionByIdForAdmin(
  id: number,
): Promise<PromotionRow | null> {
  const row = await db.query.promotions.findFirst({
    where: eq(promotions.id, id),
  });
  return row ?? null;
}

export interface PromotionEntryDetail {
  id: number;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
}

/**
 * Returns up to `limit` entries with denormalised user info for the admin
 * participant list. Ordered by entry time ascending so the table reads like
 * a guest book.
 */
export async function listPromotionEntriesForAdmin(
  promotionId: number,
  limit = 500,
): Promise<PromotionEntryDetail[]> {
  const result = await db.execute(sql`
    SELECT pe.id, pe.user_id, pe.created_at, u.name, u.email
    FROM promotion_entries pe
    LEFT JOIN users u ON u.id = pe.user_id
    WHERE pe.promotion_id = ${promotionId}
    ORDER BY pe.created_at ASC
    LIMIT ${limit}
  `);

  const rows = queryResultRows<{
    id: number | string;
    user_id: string;
    created_at: Date | string;
    name: string | null;
    email: string | null;
  }>(result);

  return rows.map((row) => ({
    id: Number(row.id),
    userId: row.user_id,
    userName: row.name,
    userEmail: row.email,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  }));
}

export interface PickWinnerResult {
  winnerUserId: string;
  winnerName: string | null;
  winnerEmail: string | null;
  pickedAt: string;
}

/**
 * Picks a uniformly random entry, stamps the promotion row, and returns the
 * winner's display info. The randomness lives in SQL (`ORDER BY random()
 * LIMIT 1`) so the pick happens in one statement with no client-side bias.
 *
 * Idempotency caveat: calling this twice will *re-pick*. The admin UI
 * guards against accidental clicks with a "yeniden seç" confirmation; the
 * server intentionally does not block re-rolls because admins sometimes
 * need to re-draw if the first winner is ineligible.
 */
export async function pickRandomWinner(
  promotionId: number,
): Promise<PickWinnerResult | null> {
  const result = await db.execute(sql`
    WITH picked AS (
      SELECT user_id
      FROM promotion_entries
      WHERE promotion_id = ${promotionId}
      ORDER BY random()
      LIMIT 1
    ), updated AS (
      UPDATE promotions
      SET winner_user_id = (SELECT user_id FROM picked),
          winner_picked_at = NOW()
      WHERE id = ${promotionId} AND EXISTS (SELECT 1 FROM picked)
      RETURNING winner_user_id, winner_picked_at
    )
    SELECT u.id AS user_id, u.name, u.email, upd.winner_picked_at
    FROM updated upd
    LEFT JOIN users u ON u.id = upd.winner_user_id
  `);

  const rows = queryResultRows<{
    user_id: string;
    name: string | null;
    email: string | null;
    winner_picked_at: Date | string;
  }>(result);
  const row = rows[0];

  if (!row?.user_id) return null;

  const pickedAt =
    row.winner_picked_at instanceof Date
      ? row.winner_picked_at.toISOString()
      : new Date(row.winner_picked_at).toISOString();

  return {
    winnerUserId: row.user_id,
    winnerName: row.name,
    winnerEmail: row.email,
    pickedAt,
  };
}

export async function clearWinner(promotionId: number): Promise<void> {
  await db
    .update(promotions)
    .set({ winnerUserId: null, winnerPickedAt: null })
    .where(eq(promotions.id, promotionId));
}
