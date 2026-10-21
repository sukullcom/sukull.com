import "server-only";

import { and, count, countDistinct, desc, eq, gt, gte, inArray, isNotNull, lte, sql } from "drizzle-orm";

import db from "@/db/drizzle";
import {
  marketplaceProfiles,
  providerServices,
  serviceMessages,
  serviceQuotes,
  serviceRequests,
  serviceReviews,
  users,
  type ServiceRequestAnswer,
} from "@/db/schema";

export const REVIEW_TABS = ["pending", "open", "rejected", "accepted", "expired", "all"] as const;
export type ReviewTab = (typeof REVIEW_TABS)[number];

export async function listRequestsForReview(tab: ReviewTab, limit = 200) {
  const now = new Date();
  const where =
    tab === "all"
      ? undefined
      : tab === "expired"
        ? and(inArray(serviceRequests.status, ["open", "expired"]), lte(serviceRequests.expiresAt, now))
        : tab === "open"
          ? and(eq(serviceRequests.status, "open"), gt(serviceRequests.expiresAt, now))
          : eq(serviceRequests.status, tab);

  const rows = await db
    .select({
      id: serviceRequests.id,
      serviceSlug: serviceRequests.serviceSlug,
      answers: serviceRequests.answers,
      details: serviceRequests.details,
      city: serviceRequests.city,
      district: serviceRequests.district,
      neighborhood: serviceRequests.neighborhood,
      timingType: serviceRequests.timingType,
      scheduledAt: serviceRequests.scheduledAt,
      expiresAt: serviceRequests.expiresAt,
      status: serviceRequests.status,
      quoteCount: serviceRequests.quoteCount,
      contactChannel: serviceRequests.contactChannel,
      rejectionNote: serviceRequests.rejectionNote,
      reviewedAt: serviceRequests.reviewedAt,
      createdAt: serviceRequests.createdAt,
      customerName: users.name,
      customerEmail: users.email,
      customerPhone: users.phone,
      firstName: marketplaceProfiles.firstName,
      lastName: marketplaceProfiles.lastName,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceRequests.customerId))
    .where(where)
    .orderBy(tab === "pending" ? serviceRequests.createdAt : desc(serviceRequests.createdAt))
    .limit(limit);

  return rows.map((row) => ({ ...row, answers: (row.answers ?? []) as ServiceRequestAnswer[] }));
}

export async function countPendingServiceRequests(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(serviceRequests).where(eq(serviceRequests.status, "pending"));
  return Number(row?.value ?? 0);
}

const DAY = 24 * 60 * 60 * 1000;

export async function getMarketplaceStats() {
  const now = new Date();
  const since7 = new Date(now.getTime() - 7 * DAY);
  const since30 = new Date(now.getTime() - 30 * DAY);
  const since14 = new Date(now.getTime() - 13 * DAY);
  since14.setHours(0, 0, 0, 0);

  const [
    statusRows,
    [created7],
    [created30],
    [quoteTotals],
    [messageTotals],
    [reviewTotals],
    [providerTotals],
    [customerTotals],
    [reviewSpeed],
    topServices,
    topCities,
    daily,
  ] = await Promise.all([
    db
      .select({
        status: serviceRequests.status,
        live: sql<boolean>`${serviceRequests.expiresAt} > now()`,
        value: count(),
      })
      .from(serviceRequests)
      .groupBy(serviceRequests.status, sql`${serviceRequests.expiresAt} > now()`),
    db.select({ value: count() }).from(serviceRequests).where(gte(serviceRequests.createdAt, since7)),
    db.select({ value: count() }).from(serviceRequests).where(gte(serviceRequests.createdAt, since30)),
    db
      .select({
        total: count(),
        accepted: sql<number>`count(*) filter (where ${serviceQuotes.status} = 'accepted')`,
        avgPrice: sql<number | null>`round(avg(${serviceQuotes.priceTl}))`,
      })
      .from(serviceQuotes),
    db.select({ value: count() }).from(serviceMessages),
    db.select({ total: count(), avg: sql<number | null>`round(avg(${serviceReviews.stars})::numeric, 1)` }).from(serviceReviews),
    db.select({ value: countDistinct(providerServices.userId) }).from(providerServices),
    db.select({ value: countDistinct(serviceRequests.customerId) }).from(serviceRequests),
    db
      .select({
        hours: sql<number | null>`round((avg(extract(epoch from (${serviceRequests.reviewedAt} - ${serviceRequests.createdAt}))) / 3600)::numeric, 1)`,
      })
      .from(serviceRequests)
      .where(isNotNull(serviceRequests.reviewedAt)),
    db
      .select({ slug: serviceRequests.serviceSlug, value: count() })
      .from(serviceRequests)
      .groupBy(serviceRequests.serviceSlug)
      .orderBy(desc(count()))
      .limit(10),
    db
      .select({ city: serviceRequests.city, value: count() })
      .from(serviceRequests)
      .groupBy(serviceRequests.city)
      .orderBy(desc(count()))
      .limit(10),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${serviceRequests.createdAt} at time zone 'Europe/Istanbul'), 'YYYY-MM-DD')`,
        value: count(),
      })
      .from(serviceRequests)
      .where(gte(serviceRequests.createdAt, since14))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
  ]);

  const byStatus = { pending: 0, open: 0, rejected: 0, accepted: 0, expired: 0 };
  for (const row of statusRows) {
    const n = Number(row.value);
    if (row.status === "pending") byStatus.pending += n;
    else if (row.status === "rejected") byStatus.rejected += n;
    else if (row.status === "accepted") byStatus.accepted += n;
    else if (row.status === "open" && row.live) byStatus.open += n;
    else byStatus.expired += n;
  }
  const totalRequests = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  const quotes = Number(quoteTotals?.total ?? 0);
  const acceptedQuotes = Number(quoteTotals?.accepted ?? 0);
  const reviewed = byStatus.open + byStatus.accepted + byStatus.expired + byStatus.rejected;
  const published = byStatus.open + byStatus.accepted + byStatus.expired;

  const dailyMap = new Map(daily.map((row) => [row.day, Number(row.value)]));
  const days: { day: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(d);
    days.push({ day: key, value: dailyMap.get(key) ?? 0 });
  }

  return {
    totalRequests,
    byStatus,
    created7: Number(created7?.value ?? 0),
    created30: Number(created30?.value ?? 0),
    quotes,
    acceptedQuotes,
    avgQuotesPerRequest: published > 0 ? Math.round((quotes / published) * 10) / 10 : 0,
    acceptRate: quotes > 0 ? Math.round((acceptedQuotes / quotes) * 100) : 0,
    rejectRate: reviewed > 0 ? Math.round((byStatus.rejected / reviewed) * 100) : 0,
    avgPriceTl: quoteTotals?.avgPrice === null || quoteTotals?.avgPrice === undefined ? null : Number(quoteTotals.avgPrice),
    messages: Number(messageTotals?.value ?? 0),
    reviews: Number(reviewTotals?.total ?? 0),
    avgStars: reviewTotals?.avg === null || reviewTotals?.avg === undefined ? null : Number(reviewTotals.avg),
    providers: Number(providerTotals?.value ?? 0),
    customers: Number(customerTotals?.value ?? 0),
    avgReviewHours: reviewSpeed?.hours === null || reviewSpeed?.hours === undefined ? null : Number(reviewSpeed.hours),
    topServices: topServices.map((row) => ({ slug: row.slug, value: Number(row.value) })),
    topCities: topCities.map((row) => ({ city: row.city, value: Number(row.value) })),
    days,
  };
}
