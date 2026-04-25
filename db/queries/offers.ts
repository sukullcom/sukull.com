/**
 * Listing offers — teacher-side bids on student listings.
 *
 * `createOffer` is the hot path: it consumes one credit, writes an
 * offer row, and bumps `listings.offer_count` via an AFTER trigger.
 * A DB-level BEFORE trigger also caps pending offers at
 * `MAX_OFFERS_PER_LISTING` so the invariant holds even if a bug in
 * the action layer bypasses our explicit check.
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import {
  creditUsage,
  listingOffers,
  listings,
  userCredits,
} from "@/db/schema";
import { ensureUnlockedThreadForOfferTx } from "@/db/queries/messages";

export const MAX_OFFERS_PER_LISTING = 4;

export type OfferRow = {
  id: number;
  listingId: number;
  teacherId: string;
  priceProposal: number;
  note: string | null;
  status: "pending" | "withdrawn" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getOffersForListing(
  listingId: number,
): Promise<OfferRow[]> {
  const rows = await db.query.listingOffers.findMany({
    where: eq(listingOffers.listingId, listingId),
    orderBy: [asc(listingOffers.createdAt)],
  });
  return rows.map(toOfferRow);
}

export async function getMyOffers(teacherId: string): Promise<OfferRow[]> {
  const rows = await db.query.listingOffers.findMany({
    where: eq(listingOffers.teacherId, teacherId),
    orderBy: [desc(listingOffers.createdAt)],
  });
  return rows.map(toOfferRow);
}

export async function hasTeacherOfferedOnListing(
  listingId: number,
  teacherId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: listingOffers.id })
    .from(listingOffers)
    .where(
      and(
        eq(listingOffers.listingId, listingId),
        eq(listingOffers.teacherId, teacherId),
      ),
    )
    .limit(1);
  return !!row;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type CreateOfferResult =
  | { ok: true; offer: OfferRow; chatId: number }
  | {
      ok: false;
      code:
        | "listing_not_found"
        | "listing_closed"
        | "offer_cap_reached"
        | "already_offered"
        | "insufficient_credits"
        | "self_offer_forbidden"
        | "unknown";
      message?: string;
    };

/**
 * Create a teacher offer on a student listing. Runs atomically:
 *   1. Load listing, verify it's open.
 *   2. Deduct 1 credit from the teacher's userCredits row (fails if
 *      availableCredits < 1).
 *   3. Insert the offer. The BEFORE trigger on listing_offers enforces
 *      the 4-offer cap; if it raises, we catch and surface a typed
 *      error instead of leaking the raw Postgres text.
 *   4. Write a credit_usage log row.
 */
export async function createOffer(input: {
  listingId: number;
  teacherId: string;
  priceProposal: number;
  note?: string | null;
}): Promise<CreateOfferResult> {
  try {
    return await db.transaction(async (tx) => {
      const listing = await tx.query.listings.findFirst({
        where: eq(listings.id, input.listingId),
        columns: {
          id: true,
          status: true,
          studentId: true,
          offerCount: true,
        },
      });
      if (!listing) {
        return { ok: false as const, code: "listing_not_found" as const };
      }
      if (listing.status !== "open") {
        return { ok: false as const, code: "listing_closed" as const };
      }
      if (listing.studentId === input.teacherId) {
        return { ok: false as const, code: "self_offer_forbidden" as const };
      }
      if (listing.offerCount >= MAX_OFFERS_PER_LISTING) {
        return { ok: false as const, code: "offer_cap_reached" as const };
      }

      const existing = await tx.query.listingOffers.findFirst({
        where: and(
          eq(listingOffers.listingId, input.listingId),
          eq(listingOffers.teacherId, input.teacherId),
        ),
        columns: { id: true },
      });
      if (existing) {
        return { ok: false as const, code: "already_offered" as const };
      }

      const creditResult = await tx
        .update(userCredits)
        .set({
          usedCredits: sql`${userCredits.usedCredits} + 1`,
          availableCredits: sql`${userCredits.availableCredits} - 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userCredits.userId, input.teacherId),
            sql`${userCredits.availableCredits} >= 1`,
          ),
        )
        .returning({ id: userCredits.id });

      if (creditResult.length === 0) {
        return { ok: false as const, code: "insufficient_credits" as const };
      }

      const [offer] = await tx
        .insert(listingOffers)
        .values({
          listingId: input.listingId,
          teacherId: input.teacherId,
          priceProposal: input.priceProposal,
          note: input.note ?? null,
        })
        .returning();

      await tx.insert(creditUsage).values({
        userId: input.teacherId,
        reason: "listing_offer",
        creditsUsed: 1,
        refType: "listing",
        refId: String(input.listingId),
      });

      const { chatId } = await ensureUnlockedThreadForOfferTx(tx, {
        studentId: listing.studentId,
        teacherId: input.teacherId,
      });

      return { ok: true as const, offer: toOfferRow(offer), chatId };
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("LISTING_OFFER_CAP_REACHED")) {
      return { ok: false, code: "offer_cap_reached" };
    }
    return {
      ok: false,
      code: "unknown",
      message: msg,
    };
  }
}

export async function withdrawOffer(offerId: number, teacherId: string) {
  const [row] = await db
    .update(listingOffers)
    .set({ status: "withdrawn", updatedAt: new Date() })
    .where(
      and(
        eq(listingOffers.id, offerId),
        eq(listingOffers.teacherId, teacherId),
      ),
    )
    .returning();
  return row ? toOfferRow(row) : null;
}

export async function acceptOffer(offerId: number, studentId: string) {
  return await db.transaction(async (tx) => {
    const offer = await tx.query.listingOffers.findFirst({
      where: eq(listingOffers.id, offerId),
    });
    if (!offer) return null;

    const listing = await tx.query.listings.findFirst({
      where: eq(listings.id, offer.listingId),
      columns: { id: true, studentId: true },
    });
    if (!listing || listing.studentId !== studentId) return null;

    const [updated] = await tx
      .update(listingOffers)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(listingOffers.id, offerId))
      .returning();

    // Accepting an offer closes the listing and rejects other pending
    // offers so no one else keeps bidding on a done deal.
    await tx
      .update(listingOffers)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(
        and(
          eq(listingOffers.listingId, offer.listingId),
          eq(listingOffers.status, "pending"),
        ),
      );
    await tx
      .update(listings)
      .set({ status: "closed", updatedAt: new Date() })
      .where(eq(listings.id, offer.listingId));

    return updated ? toOfferRow(updated) : null;
  });
}

export async function rejectOffer(offerId: number, studentId: string) {
  return await db.transaction(async (tx) => {
    const offer = await tx.query.listingOffers.findFirst({
      where: eq(listingOffers.id, offerId),
    });
    if (!offer) return null;

    const listing = await tx.query.listings.findFirst({
      where: eq(listings.id, offer.listingId),
      columns: { studentId: true },
    });
    if (!listing || listing.studentId !== studentId) return null;

    const [updated] = await tx
      .update(listingOffers)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(listingOffers.id, offerId))
      .returning();
    return updated ? toOfferRow(updated) : null;
  });
}

function toOfferRow(r: typeof listingOffers.$inferSelect): OfferRow {
  return {
    id: r.id,
    listingId: r.listingId,
    teacherId: r.teacherId,
    priceProposal: r.priceProposal,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
