/**
 * Student listings ("İlanlar") — the supply-side of the marketplace.
 *
 * Read helpers here only concern themselves with shapes for the UI.
 * Mutations that charge credit (teacher submitting an offer, student
 * unlocking a chat) live in `./offers.ts` and `./messages.ts` and
 * always run inside a DB transaction.
 */
import { and, desc, eq, or, sql } from "drizzle-orm";
import { queryResultRows } from "@/lib/query-result";
import db from "@/db/drizzle";
import { listings, users } from "@/db/schema";
import type {
  listingLessonModeEnum,
  listingStatusEnum,
} from "@/db/schema";

type InferEnum<E> = E extends { enumValues: infer V extends readonly string[] }
  ? V[number]
  : never;
export type ListingStatus = InferEnum<typeof listingStatusEnum>;
export type ListingLessonMode = InferEnum<typeof listingLessonModeEnum>;

export type ListingRow = {
  id: number;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  subject: string;
  grade: string | null;
  title: string;
  description: string;
  lessonMode: ListingLessonMode;
  city: string | null;
  district: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredHours: string | null;
  status: ListingStatus;
  offerCount: number;
  createdAt: string;
  expiresAt: string | null;
};

export type ListingWithOffersRow = ListingRow & {
  offers: Array<{
    id: number;
    teacherId: string;
    teacherName: string;
    teacherAvatar: string | null;
    priceProposal: number;
    note: string | null;
    status: "pending" | "withdrawn" | "accepted" | "rejected";
    createdAt: string;
  }>;
};

// ---------------------------------------------------------------------------
// Browsing (teacher side) & filtering
// ---------------------------------------------------------------------------

export type ListingFilters = {
  subject?: string;
  lessonMode?: ListingLessonMode;
  city?: string;
  limit?: number;
  offset?: number;
};

export async function getOpenListings(
  filters: ListingFilters = {},
): Promise<ListingRow[]> {
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const offset = Math.max(0, filters.offset ?? 0);

  const conditions = [eq(listings.status, "open" as const)];
  if (filters.subject) {
    conditions.push(eq(listings.subject, filters.subject));
  }
  if (filters.lessonMode) {
    conditions.push(
      or(
        eq(listings.lessonMode, filters.lessonMode),
        eq(listings.lessonMode, "both" as const),
      )!,
    );
  }
  if (filters.city) {
    conditions.push(eq(listings.city, filters.city));
  }

  const rows = await db
    .select({
      id: listings.id,
      studentId: listings.studentId,
      studentName: users.name,
      studentAvatar: users.avatar,
      subject: listings.subject,
      grade: listings.grade,
      title: listings.title,
      description: listings.description,
      lessonMode: listings.lessonMode,
      city: listings.city,
      district: listings.district,
      budgetMin: listings.budgetMin,
      budgetMax: listings.budgetMax,
      preferredHours: listings.preferredHours,
      status: listings.status,
      offerCount: listings.offerCount,
      createdAt: listings.createdAt,
      expiresAt: listings.expiresAt,
    })
    .from(listings)
    .leftJoin(users, eq(users.id, listings.studentId))
    .where(and(...conditions))
    .orderBy(desc(listings.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(toListingRow);
}

// ---------------------------------------------------------------------------
// Single listing (for detail page)
// ---------------------------------------------------------------------------

export async function getListingById(id: number): Promise<ListingRow | null> {
  const [row] = await db
    .select({
      id: listings.id,
      studentId: listings.studentId,
      studentName: users.name,
      studentAvatar: users.avatar,
      subject: listings.subject,
      grade: listings.grade,
      title: listings.title,
      description: listings.description,
      lessonMode: listings.lessonMode,
      city: listings.city,
      district: listings.district,
      budgetMin: listings.budgetMin,
      budgetMax: listings.budgetMax,
      preferredHours: listings.preferredHours,
      status: listings.status,
      offerCount: listings.offerCount,
      createdAt: listings.createdAt,
      expiresAt: listings.expiresAt,
    })
    .from(listings)
    .leftJoin(users, eq(users.id, listings.studentId))
    .where(eq(listings.id, id))
    .limit(1);

  return row ? toListingRow(row) : null;
}

/**
 * Fetch a listing along with its offers (for the student-side detail
 * page). Offers include the teacher's name + avatar so we can render
 * the "you have N offers" panel without an extra round-trip.
 */
export async function getListingWithOffers(
  id: number,
): Promise<ListingWithOffersRow | null> {
  const base = await getListingById(id);
  if (!base) return null;

  const offers = await db.execute(sql`
    SELECT
      lo.id,
      lo.teacher_id,
      lo.price_proposal,
      lo.note,
      lo.status,
      lo.created_at,
      u.name AS teacher_name,
      u.avatar AS teacher_avatar
    FROM listing_offers lo
    JOIN users u ON u.id = lo.teacher_id
    WHERE lo.listing_id = ${id}
    ORDER BY lo.created_at ASC
  `);
  const rows = queryResultRows<Record<string, unknown>>(offers);

  return {
    ...base,
    offers: rows.map((r) => ({
      id: Number(r.id),
      teacherId: String(r.teacher_id),
      teacherName: String(r.teacher_name ?? ""),
      teacherAvatar: (r.teacher_avatar as string | null) ?? null,
      priceProposal: Number(r.price_proposal),
      note: (r.note as string | null) ?? null,
      status: r.status as ListingWithOffersRow["offers"][number]["status"],
      createdAt: new Date(String(r.created_at)).toISOString(),
    })),
  };
}

// ---------------------------------------------------------------------------
// Student-owned listings (my-listings page)
// ---------------------------------------------------------------------------

export async function getMyListings(studentId: string): Promise<ListingRow[]> {
  const rows = await db
    .select({
      id: listings.id,
      studentId: listings.studentId,
      studentName: users.name,
      studentAvatar: users.avatar,
      subject: listings.subject,
      grade: listings.grade,
      title: listings.title,
      description: listings.description,
      lessonMode: listings.lessonMode,
      city: listings.city,
      district: listings.district,
      budgetMin: listings.budgetMin,
      budgetMax: listings.budgetMax,
      preferredHours: listings.preferredHours,
      status: listings.status,
      offerCount: listings.offerCount,
      createdAt: listings.createdAt,
      expiresAt: listings.expiresAt,
    })
    .from(listings)
    .leftJoin(users, eq(users.id, listings.studentId))
    .where(eq(listings.studentId, studentId))
    .orderBy(desc(listings.createdAt));

  return rows.map(toListingRow);
}

// ---------------------------------------------------------------------------
// Create / close
// ---------------------------------------------------------------------------

export type CreateListingInput = {
  studentId: string;
  subject: string;
  grade?: string | null;
  title: string;
  description: string;
  lessonMode: ListingLessonMode;
  city?: string | null;
  district?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredHours?: string | null;
};

export async function createListing(input: CreateListingInput) {
  const [row] = await db
    .insert(listings)
    .values({
      studentId: input.studentId,
      subject: input.subject,
      grade: input.grade ?? null,
      title: input.title,
      description: input.description,
      lessonMode: input.lessonMode,
      city: input.city ?? null,
      district: input.district ?? null,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      preferredHours: input.preferredHours ?? null,
    })
    .returning();
  return row;
}

export async function closeListing(listingId: number, studentId: string) {
  const [row] = await db
    .update(listings)
    .set({ status: "closed", updatedAt: new Date() })
    .where(and(eq(listings.id, listingId), eq(listings.studentId, studentId)))
    .returning();
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch (listingId -> offerCount) for a set of listings. Useful when
 * rendering the teacher browse view so we can badge "3/4 teklif".
 */
export async function getListingsOfferCount(
  listingIds: number[],
): Promise<Record<number, number>> {
  if (listingIds.length === 0) return {};
  const rows = await db
    .select({ id: listings.id, count: listings.offerCount })
    .from(listings)
    .where(
      or(...listingIds.map((id) => eq(listings.id, id)))!,
    );
  const out: Record<number, number> = {};
  for (const r of rows) out[r.id] = r.count;
  return out;
}

type RawListingRow = {
  id: number;
  studentId: string;
  studentName: string | null;
  studentAvatar: string | null;
  subject: string;
  grade: string | null;
  title: string;
  description: string;
  lessonMode: ListingLessonMode;
  city: string | null;
  district: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredHours: string | null;
  status: ListingStatus;
  offerCount: number;
  createdAt: Date;
  expiresAt: Date | null;
};

function toListingRow(r: RawListingRow): ListingRow {
  return {
    id: r.id,
    studentId: r.studentId,
    studentName: r.studentName ?? "",
    studentAvatar: r.studentAvatar,
    subject: r.subject,
    grade: r.grade,
    title: r.title,
    description: r.description,
    lessonMode: r.lessonMode,
    city: r.city,
    district: r.district,
    budgetMin: r.budgetMin,
    budgetMax: r.budgetMax,
    preferredHours: r.preferredHours,
    status: r.status,
    offerCount: r.offerCount,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
  };
}
