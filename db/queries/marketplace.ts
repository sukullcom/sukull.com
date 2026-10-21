import "server-only";

import { and, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";

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
import { cleanFilters, requestMatchesEntry, type ProviderServiceEntry } from "@/lib/marketplace/provider-match";

export async function getMarketAccount(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.name,
      avatar: users.avatar,
      phone: users.phone,
      authProvider: users.provider,
      referralCode: users.referralCode,
      firstName: marketplaceProfiles.firstName,
      lastName: marketplaceProfiles.lastName,
      city: marketplaceProfiles.city,
      district: marketplaceProfiles.district,
      neighborhood: marketplaceProfiles.neighborhood,
    })
    .from(users)
    .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export async function listProviderSlugs(userId: string): Promise<string[]> {
  const rows = await db
    .select({ serviceSlug: providerServices.serviceSlug })
    .from(providerServices)
    .where(eq(providerServices.userId, userId));
  return rows.map((row) => row.serviceSlug);
}

export async function listProviderServiceEntries(userId: string): Promise<ProviderServiceEntry[]> {
  const rows = await db
    .select({ serviceSlug: providerServices.serviceSlug, filters: providerServices.filters })
    .from(providerServices)
    .where(eq(providerServices.userId, userId))
    .orderBy(providerServices.createdAt);
  return rows.map((row) => ({ slug: row.serviceSlug, filters: cleanFilters(row.serviceSlug, row.filters) }));
}

const quoteCard = {
  id: serviceQuotes.id,
  requestId: serviceQuotes.requestId,
  providerId: serviceQuotes.providerId,
  priceTl: serviceQuotes.priceTl,
  message: serviceQuotes.message,
  status: serviceQuotes.status,
  createdAt: serviceQuotes.createdAt,
  avatar: users.avatar,
  username: users.name,
  firstName: marketplaceProfiles.firstName,
  lastName: marketplaceProfiles.lastName,
};

const CUSTOMER_JOBS_LIMIT = 100;
const PROVIDER_LIST_LIMIT = 100;
/** Akışta gösterilen en fazla ilan. */
const FEED_PAGE_SIZE = 60;

export async function listCustomerJobs(customerId: string) {
  const requests = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.customerId, customerId))
    .orderBy(desc(serviceRequests.createdAt))
    .limit(CUSTOMER_JOBS_LIMIT);

  if (requests.length === 0) return [];

  const quotes = await db
    .select(quoteCard)
    .from(serviceQuotes)
    .innerJoin(users, eq(users.id, serviceQuotes.providerId))
    .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceQuotes.providerId))
    .where(inArray(serviceQuotes.requestId, requests.map((request) => request.id)))
    .orderBy(desc(serviceQuotes.createdAt));

  return requests.map((request) => ({
    ...request,
    quotes: quotes.filter((quote) => quote.requestId === request.id),
  }));
}

export async function getCustomerJob(customerId: string, requestId: number) {
  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(and(eq(serviceRequests.id, requestId), eq(serviceRequests.customerId, customerId)))
    .limit(1);
  if (!request) return null;

  const quotes = await db
    .select(quoteCard)
    .from(serviceQuotes)
    .innerJoin(users, eq(users.id, serviceQuotes.providerId))
    .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceQuotes.providerId))
    .where(eq(serviceQuotes.requestId, requestId))
    .orderBy(desc(serviceQuotes.createdAt));

  const quoteIds = quotes.map((quote) => quote.id);
  const messages = quoteIds.length
    ? await db
        .select()
        .from(serviceMessages)
        .where(inArray(serviceMessages.quoteId, quoteIds))
        .orderBy(serviceMessages.createdAt)
    : [];

  const reviews = quoteIds.length
    ? await db.select().from(serviceReviews).where(inArray(serviceReviews.quoteId, quoteIds))
    : [];
  const ratings = await providerRatings(quotes.map((quote) => quote.providerId));

  return {
    ...request,
    answers: (request.answers ?? []) as ServiceRequestAnswer[],
    quotes: quotes.map((quote) => ({
      ...quote,
      messages: messages.filter((message) => message.quoteId === quote.id),
      review: reviews.find((review) => review.quoteId === quote.id) ?? null,
      rating: ratings.get(quote.providerId) ?? { average: 0, count: 0 },
    })),
  };
}

export type ProviderRating = { average: number; count: number };

/** Hizmet verenlerin tüm işlerden aldığı puanların ortalaması ve sayısı. */
export async function providerRatings(providerIds: string[]): Promise<Map<string, ProviderRating>> {
  const ids = Array.from(new Set(providerIds));
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({
      providerId: serviceReviews.providerId,
      average: sql<string>`avg(${serviceReviews.stars})`,
      count: sql<number>`count(*)::int`,
    })
    .from(serviceReviews)
    .where(inArray(serviceReviews.providerId, ids))
    .groupBy(serviceReviews.providerId);
  return new Map(rows.map((row) => [row.providerId, { average: Number(row.average), count: row.count }]));
}

/** Akışta taranan en yeni açık ilan sayısı; eşleşme süzgeci bundan sonra uygulanır. */
const FEED_SCAN_LIMIT = 500;

export async function listProviderFeed(providerId: string) {
  const entries = await listProviderServiceEntries(providerId);
  const slugs = entries.map((entry) => entry.slug);
  if (slugs.length === 0) return { slugs, requests: [] };
  const filtersBySlug = new Map(entries.map((entry) => [entry.slug, entry.filters]));

  const rows = await db
    .select({
      id: serviceRequests.id,
      serviceSlug: serviceRequests.serviceSlug,
      city: serviceRequests.city,
      district: serviceRequests.district,
      neighborhood: serviceRequests.neighborhood,
      timingType: serviceRequests.timingType,
      scheduledAt: serviceRequests.scheduledAt,
      expiresAt: serviceRequests.expiresAt,
      createdAt: serviceRequests.createdAt,
      details: serviceRequests.details,
      answers: serviceRequests.answers,
      customerId: serviceRequests.customerId,
      username: users.name,
      firstName: marketplaceProfiles.firstName,
      lastName: marketplaceProfiles.lastName,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceRequests.customerId))
    .where(
      and(
        inArray(serviceRequests.serviceSlug, slugs),
        eq(serviceRequests.status, "open"),
        gt(serviceRequests.expiresAt, new Date()),
        lt(serviceRequests.quoteCount, 4),
        sql`not exists (select 1 from service_quotes q where q.request_id = ${serviceRequests.id} and q.provider_id = ${providerId})`,
      ),
    )
    .orderBy(desc(serviceRequests.createdAt))
    .limit(FEED_SCAN_LIMIT);

  return {
    slugs,
    requests: rows
      .filter(
        (row) =>
          row.customerId === providerId ||
          requestMatchesEntry(row.serviceSlug, filtersBySlug.get(row.serviceSlug), (row.answers ?? []) as ServiceRequestAnswer[]),
      )
      .slice(0, FEED_PAGE_SIZE)
      .map((row) => ({
        id: row.id,
        serviceSlug: row.serviceSlug,
        city: row.city,
        district: row.district,
        neighborhood: row.neighborhood,
        timingType: row.timingType,
        scheduledAt: row.scheduledAt,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
        details: row.details,
        answers: (row.answers ?? []) as ServiceRequestAnswer[],
        username: row.username,
        firstName: row.firstName,
        lastName: row.lastName,
        mine: row.customerId === providerId,
      })),
  };
}

export async function listOpenRequestPreviews(limit = 8) {
  const rows = await db
    .select({
      id: serviceRequests.id,
      customerId: serviceRequests.customerId,
      serviceSlug: serviceRequests.serviceSlug,
      answers: serviceRequests.answers,
      details: serviceRequests.details,
      timingType: serviceRequests.timingType,
      scheduledAt: serviceRequests.scheduledAt,
      username: users.name,
      firstName: marketplaceProfiles.firstName,
      lastName: marketplaceProfiles.lastName,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceRequests.customerId))
    .where(
      and(
        eq(serviceRequests.status, "open"),
        gt(serviceRequests.expiresAt, new Date()),
        lt(serviceRequests.quoteCount, 4),
      ),
    )
    .orderBy(desc(serviceRequests.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    answers: (row.answers ?? []) as ServiceRequestAnswer[],
  }));
}

export async function getProviderRequest(providerId: string, requestId: number) {
  const entries = await listProviderServiceEntries(providerId);
  const [request] = await db
    .select({
      id: serviceRequests.id,
      customerId: serviceRequests.customerId,
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
      username: users.name,
      firstName: marketplaceProfiles.firstName,
      lastName: marketplaceProfiles.lastName,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceRequests.customerId))
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!request || request.customerId === providerId) return null;
  const entry = entries.find((item) => item.slug === request.serviceSlug);
  if (!entry) return null;
  if (!requestMatchesEntry(request.serviceSlug, entry.filters, (request.answers ?? []) as ServiceRequestAnswer[])) return null;
  if (request.status !== "open" || request.expiresAt <= new Date() || request.quoteCount >= 4) {
    return null;
  }

  const [existing] = await db
    .select({ id: serviceQuotes.id })
    .from(serviceQuotes)
    .where(and(eq(serviceQuotes.requestId, requestId), eq(serviceQuotes.providerId, providerId)))
    .limit(1);

  return {
    ...request,
    answers: (request.answers ?? []) as ServiceRequestAnswer[],
    existingQuoteId: existing?.id ?? null,
  };
}

export async function findProviderQuoteId(providerId: string, requestId: number): Promise<number | null> {
  const [row] = await db
    .select({ id: serviceQuotes.id })
    .from(serviceQuotes)
    .where(and(eq(serviceQuotes.requestId, requestId), eq(serviceQuotes.providerId, providerId)))
    .limit(1);
  return row?.id ?? null;
}

export async function listProviderQuotes(providerId: string) {
  return db
    .select({
      id: serviceQuotes.id,
      requestId: serviceQuotes.requestId,
      priceTl: serviceQuotes.priceTl,
      status: serviceQuotes.status,
      createdAt: serviceQuotes.createdAt,
      serviceSlug: serviceRequests.serviceSlug,
      city: serviceRequests.city,
      district: serviceRequests.district,
      timingType: serviceRequests.timingType,
      scheduledAt: serviceRequests.scheduledAt,
      requestStatus: serviceRequests.status,
      expiresAt: serviceRequests.expiresAt,
      username: users.name,
      firstName: marketplaceProfiles.firstName,
      lastName: marketplaceProfiles.lastName,
    })
    .from(serviceQuotes)
    .innerJoin(serviceRequests, eq(serviceRequests.id, serviceQuotes.requestId))
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceRequests.customerId))
    .where(eq(serviceQuotes.providerId, providerId))
    .orderBy(desc(serviceQuotes.createdAt))
    .limit(PROVIDER_LIST_LIMIT);
}

export async function getProviderQuoteThread(providerId: string, quoteId: number) {
  const [quote] = await db
    .select()
    .from(serviceQuotes)
    .where(and(eq(serviceQuotes.id, quoteId), eq(serviceQuotes.providerId, providerId)))
    .limit(1);
  if (!quote) return null;

  const [request] = await db
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
      status: serviceRequests.status,
      expiresAt: serviceRequests.expiresAt,
      username: users.name,
      firstName: marketplaceProfiles.firstName,
      lastName: marketplaceProfiles.lastName,
      contactChannel: serviceRequests.contactChannel,
      phone: users.phone,
      email: users.email,
      avatar: users.avatar,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(users.id, serviceRequests.customerId))
    .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceRequests.customerId))
    .where(eq(serviceRequests.id, quote.requestId))
    .limit(1);

  const messages = await db
    .select()
    .from(serviceMessages)
    .where(eq(serviceMessages.quoteId, quoteId))
    .orderBy(serviceMessages.createdAt);

  return {
    quote,
    request: request
      ? { ...request, answers: (request.answers ?? []) as ServiceRequestAnswer[] }
      : null,
    messages,
  };
}

export async function listProviderReviews(providerId: string) {
  return db
    .select({
      id: serviceReviews.id,
      stars: serviceReviews.stars,
      body: serviceReviews.body,
      createdAt: serviceReviews.createdAt,
      serviceSlug: serviceRequests.serviceSlug,
      username: users.name,
      firstName: marketplaceProfiles.firstName,
      lastName: marketplaceProfiles.lastName,
    })
    .from(serviceReviews)
    .innerJoin(serviceRequests, eq(serviceRequests.id, serviceReviews.requestId))
    .innerJoin(users, eq(users.id, serviceReviews.customerId))
    .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceReviews.customerId))
    .where(eq(serviceReviews.providerId, providerId))
    .orderBy(desc(serviceReviews.createdAt))
    .limit(PROVIDER_LIST_LIMIT);
}
