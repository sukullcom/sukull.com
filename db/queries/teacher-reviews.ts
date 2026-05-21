/**
 * Marketplace one-time reviews: student → teacher after accepted offer
 * or recent two-way messaging (see `lib/review-guard.ts` contract).
 */
import { unstable_cache } from "next/cache";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import {
  listingOffers,
  listings,
  teacherReviews,
  users,
} from "@/db/schema";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache-tags";
import { queryResultRows } from "@/lib/query-result";
import { getMessageUnlock } from "@/db/queries/messages";
import { isTeacher } from "@/db/queries/applications";
import {
  REVIEW_MESSAGE_MIN_PER_SIDE,
  REVIEW_MESSAGE_RECENCY_DAYS,
} from "@/lib/review-guard";

export type TeacherReviewRow = typeof teacherReviews.$inferSelect;

export type ReviewEligibility =
  | { ok: true; via: "accepted_offer"; offerId: number }
  | { ok: true; via: "messaging"; chatId: number }
  | { ok: false; code: "no_channel" };

export async function findAcceptedOfferForReview(
  offerId: number,
  studentId: string,
  teacherId: string,
) {
  const row = await db
    .select({ id: listingOffers.id })
    .from(listingOffers)
    .innerJoin(listings, eq(listings.id, listingOffers.listingId))
    .where(
      and(
        eq(listingOffers.id, offerId),
        eq(listingOffers.teacherId, teacherId),
        eq(listingOffers.status, "accepted"),
        eq(listings.studentId, studentId),
      ),
    )
    .limit(1);
  return row[0] ?? null;
}

/** Latest accepted offer this student has with this teacher (for suggested offerId). */
export async function findLatestAcceptedOfferId(studentId: string, teacherId: string) {
  const row = await db
    .select({ id: listingOffers.id })
    .from(listingOffers)
    .innerJoin(listings, eq(listings.id, listingOffers.listingId))
    .where(
      and(
        eq(listingOffers.teacherId, teacherId),
        eq(listingOffers.status, "accepted"),
        eq(listings.studentId, studentId),
      ),
    )
    .orderBy(desc(listingOffers.updatedAt))
    .limit(1);
  return row[0]?.id ?? null;
}

export async function hasTwoWayRecentMessaging(
  studentId: string,
  teacherId: string,
  days: number = REVIEW_MESSAGE_RECENCY_DAYS,
): Promise<{ ok: true; chatId: number } | { ok: false }> {
  const unlock = await getMessageUnlock(studentId, teacherId);
  const chatId = unlock?.chatId;
  if (!chatId) return { ok: false };

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const raw = await db.execute(sql`
    SELECT
      MAX(m.created_at) AS last_msg,
      COUNT(*) FILTER (WHERE m.sender = ${studentId})::int AS from_student,
      COUNT(*) FILTER (WHERE m.sender = ${teacherId})::int AS from_teacher
    FROM study_buddy_messages m
    WHERE m.chat_id = ${chatId}
  `);
  const rows = queryResultRows<{
    last_msg: string | Date | null;
    from_student: number | null;
    from_teacher: number | null;
  }>(raw);
  const r = rows[0];
  if (!r) return { ok: false };
  const last = r.last_msg ? new Date(r.last_msg) : null;
  if (!last || last < since) return { ok: false };
  if (
    (r.from_student ?? 0) < REVIEW_MESSAGE_MIN_PER_SIDE ||
    (r.from_teacher ?? 0) < REVIEW_MESSAGE_MIN_PER_SIDE
  ) {
    return { ok: false };
  }
  return { ok: true, chatId };
}

/**
 * Eligibility for POST without offerId: two-way messaging only.
 * When offerId is provided, validate separately with `findAcceptedOfferForReview`.
 */
export async function getMessagingReviewEligibility(
  studentId: string,
  teacherId: string,
): Promise<ReviewEligibility> {
  const msg = await hasTwoWayRecentMessaging(studentId, teacherId);
  if (msg.ok) return { ok: true, via: "messaging", chatId: msg.chatId };
  return { ok: false, code: "no_channel" };
}

export async function getCanReviewOverview(studentId: string, teacherId: string) {
  const existing = await findExistingReview(studentId, teacherId);
  if (existing) {
    return {
      canReview: false,
      alreadyReviewed: true as const,
      suggestedOfferId: null as number | null,
      viaMessaging: false,
      viaAcceptedOffer: false,
      chatId: null as number | null,
    };
  }

  const messaging = await hasTwoWayRecentMessaging(studentId, teacherId);
  const suggestedOfferId = await findLatestAcceptedOfferId(studentId, teacherId);

  const canReview = messaging.ok || suggestedOfferId != null;

  return {
    canReview,
    alreadyReviewed: false as const,
    suggestedOfferId,
    viaMessaging: messaging.ok,
    viaAcceptedOffer: suggestedOfferId != null,
    chatId: messaging.ok ? messaging.chatId : null,
  };
}

export async function getReviewEligibility(
  studentId: string,
  teacherId: string,
  offerIdHint?: number | null,
): Promise<ReviewEligibility> {
  if (offerIdHint != null && Number.isFinite(offerIdHint)) {
    const offer = await findAcceptedOfferForReview(offerIdHint, studentId, teacherId);
    if (offer) return { ok: true, via: "accepted_offer", offerId: offer.id };
    return { ok: false, code: "no_channel" };
  }

  return getMessagingReviewEligibility(studentId, teacherId);
}

export async function findExistingReview(studentId: string, teacherId: string) {
  return db.query.teacherReviews.findFirst({
    where: and(eq(teacherReviews.studentId, studentId), eq(teacherReviews.teacherId, teacherId)),
    columns: { id: true },
  });
}

export async function insertTeacherReview(input: {
  teacherId: string;
  studentId: string;
  offerId: number | null;
  rating: number;
  comment: string | null;
}) {
  const [row] = await db
    .insert(teacherReviews)
    .values({
      teacherId: input.teacherId,
      studentId: input.studentId,
      offerId: input.offerId,
      rating: input.rating,
      comment: input.comment,
    })
    .returning({
      id: teacherReviews.id,
      rating: teacherReviews.rating,
      comment: teacherReviews.comment,
      createdAt: teacherReviews.createdAt,
      offerId: teacherReviews.offerId,
    });
  return row ?? null;
}

async function aggregateForTeacher(teacherId: string) {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      avg: sql<string | null>`avg(${teacherReviews.rating})::text`,
    })
    .from(teacherReviews)
    .where(eq(teacherReviews.teacherId, teacherId));
  const n = Number(row?.count ?? 0);
  const avg = row?.avg != null ? Number.parseFloat(row.avg) : null;
  return {
    reviewCount: n,
    averageRating: n === 0 || avg == null || Number.isNaN(avg) ? null : Math.round(avg * 10) / 10,
  };
}

const cachedAggregate = (teacherId: string) =>
  unstable_cache(
    () => aggregateForTeacher(teacherId),
    ["teacher-review-aggregate", teacherId],
    {
      tags: [CACHE_TAGS.teacherReviews(teacherId)],
      revalidate: CACHE_TTL.teacherReviews,
    },
  )();

export async function getTeacherReviewAggregate(teacherId: string) {
  return cachedAggregate(teacherId);
}

export async function listTeacherReviewsPage(
  teacherId: string,
  opts: { cursor?: number | null; limit: number },
) {
  const limit = Math.min(Math.max(opts.limit, 1), 50);
  const cursor = opts.cursor;

  const whereClause =
    cursor != null && Number.isFinite(cursor)
      ? and(eq(teacherReviews.teacherId, teacherId), lt(teacherReviews.id, cursor))
      : eq(teacherReviews.teacherId, teacherId);

  const rows = await db
    .select({
      id: teacherReviews.id,
      rating: teacherReviews.rating,
      comment: teacherReviews.comment,
      createdAt: teacherReviews.createdAt,
      studentName: users.name,
    })
    .from(teacherReviews)
    .innerJoin(users, eq(users.id, teacherReviews.studentId))
    .where(whereClause)
    .orderBy(desc(teacherReviews.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? slice[slice.length - 1]?.id ?? null : null;

  return {
    reviews: slice.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      studentLabel: anonymizeStudentName(r.studentName),
    })),
    nextCursor,
  };
}

export function anonymizeStudentName(name: string | null | undefined): string {
  const t = (name ?? "").trim();
  if (!t) return "Öğrenci";
  const first = t.charAt(0);
  return `${first}.`;
}

export async function assertTeacherExists(teacherId: string) {
  const u = await db.query.users.findFirst({
    where: eq(users.id, teacherId),
    columns: { id: true },
  });
  if (!u || !(await isTeacher(teacherId))) return null;
  return u;
}
