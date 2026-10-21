import "server-only";

import { and, eq, gt, inArray, lt, ne, or, sql } from "drizzle-orm";

import db from "@/db/drizzle";
import { getProviderPlace, visibleToProviderSql } from "@/db/queries/marketplace";
import {
  marketplaceEmailSends,
  marketplaceNotificationPrefs,
  marketplaceProfiles,
  providerServices,
  serviceQuotes,
  serviceRequests,
  users,
  type ServiceRequestAnswer,
} from "@/db/schema";
import { digestIsDue, digestSince, pickDigestRequests } from "@/lib/marketplace/digest";
import { digestSecret, readDigestToken, signDigestToken } from "@/lib/marketplace/email-token";
import { clipText, formatPlace, formatPriceTl, greetingName, publicCustomerName, requestHeadline } from "@/lib/marketplace/format";
import { cleanFilters } from "@/lib/marketplace/provider-match";
import { logger } from "@/lib/logger";
import { escapeHtml, sendEmail } from "@/lib/transactional-email";
import { getApiUrl } from "@/lib/utils";

const LOCATION = "marketplace/notify";
/** Resend ücretsiz planda günde 100 e-posta. Teklif ve kabul için pay bırakılır. */
const DAILY_MAIL_BUDGET = 80;
const DIGEST_BATCH = 40;

function baseUrl(): string {
  return getApiUrl().replace(/\/$/, "");
}

function isMissingTable(error: unknown): boolean {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
  const message = error instanceof Error ? error.message : String(error);
  return code === "42P01" || message.includes("marketplace_notification_prefs") || message.includes("marketplace_email_sends");
}

async function claimSend(kind: "quote" | "accepted" | "digest", ref: string, userId: string): Promise<boolean> {
  const inserted = await db
    .insert(marketplaceEmailSends)
    .values({ kind, ref, userId })
    .onConflictDoNothing({ target: [marketplaceEmailSends.kind, marketplaceEmailSends.ref] })
    .returning({ id: marketplaceEmailSends.id });
  return inserted.length > 0;
}

async function releaseSend(kind: string, ref: string): Promise<void> {
  await db
    .delete(marketplaceEmailSends)
    .where(and(eq(marketplaceEmailSends.kind, kind), eq(marketplaceEmailSends.ref, ref)))
    .catch(() => undefined);
}

function unsubscribeHref(userId: string): string | null {
  const secret = digestSecret();
  if (!secret) return null;
  const token = signDigestToken(userId, secret);
  return `${baseUrl()}/bildirim/iptal?token=${encodeURIComponent(token)}`;
}

export async function notifyCustomerOfQuote(input: {
  quoteId: number;
  requestId: number;
  providerId: string;
  priceTl: number;
  message: string;
}): Promise<void> {
  try {
    const [request] = await db
      .select({
        customerId: serviceRequests.customerId,
        serviceSlug: serviceRequests.serviceSlug,
        answers: serviceRequests.answers,
        email: users.email,
        username: users.name,
        firstName: marketplaceProfiles.firstName,
        lastName: marketplaceProfiles.lastName,
      })
      .from(serviceRequests)
      .innerJoin(users, eq(users.id, serviceRequests.customerId))
      .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceRequests.customerId))
      .where(eq(serviceRequests.id, input.requestId))
      .limit(1);
    if (!request?.email?.trim()) return;

    const [provider] = await db
      .select({
        username: users.name,
        firstName: marketplaceProfiles.firstName,
        lastName: marketplaceProfiles.lastName,
      })
      .from(users)
      .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, users.id))
      .where(eq(users.id, input.providerId))
      .limit(1);

    const claimed = await claimSend("quote", String(input.quoteId), request.customerId);
    if (!claimed) return;

    const who = publicCustomerName(provider?.firstName ?? "", provider?.lastName ?? "", provider?.username ?? "");
    const title = requestHeadline(request.serviceSlug, (request.answers ?? []) as ServiceRequestAnswer[]);
    const link = `${baseUrl()}/islerim/${input.requestId}`;
    const preview = clipText(input.message, 180);
    const greeting = greetingName(request.firstName ?? "", request.lastName ?? "", request.username);
    const html = `
      <p>Merhaba ${escapeHtml(greeting)},</p>
      <p><strong>${escapeHtml(who)}</strong>, <strong>${escapeHtml(title)}</strong> ilanına ${escapeHtml(formatPriceTl(input.priceTl))} teklif verdi.</p>
      <blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #16a34a;background:#f8fafc;">${escapeHtml(preview)}</blockquote>
      <p><a href="${escapeHtml(link)}">Teklifi Sukull'da aç</a></p>
      <p style="font-size:12px;color:#64748b;">Sukull tekliflerden ücret almaz. İletişim bilgisi yalnızca teklif veren kişiye, sohbet içinde görünür.</p>
    `.trim();
    const ok = await sendEmail({
      to: request.email.trim(),
      subject: "Sukull — İlanına yeni bir teklif geldi",
      html,
      text: `${who}, ${title} ilanına ${formatPriceTl(input.priceTl)} teklif verdi. ${preview} ${link}`,
    });
    if (!ok) await releaseSend("quote", String(input.quoteId));
  } catch (error) {
    if (!isMissingTable(error)) {
      logger.error({ message: "Teklif e-postası gönderilemedi", error, location: LOCATION, fields: { quoteId: input.quoteId } });
    }
  }
}

export async function notifyProviderQuoteAccepted(quoteId: number): Promise<void> {
  try {
    const [quote] = await db
      .select({
        providerId: serviceQuotes.providerId,
        requestId: serviceQuotes.requestId,
        email: users.email,
        username: users.name,
        firstName: marketplaceProfiles.firstName,
        lastName: marketplaceProfiles.lastName,
        serviceSlug: serviceRequests.serviceSlug,
        answers: serviceRequests.answers,
        city: serviceRequests.city,
        district: serviceRequests.district,
        neighborhood: serviceRequests.neighborhood,
      })
      .from(serviceQuotes)
      .innerJoin(users, eq(users.id, serviceQuotes.providerId))
      .innerJoin(serviceRequests, eq(serviceRequests.id, serviceQuotes.requestId))
      .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, serviceQuotes.providerId))
      .where(eq(serviceQuotes.id, quoteId))
      .limit(1);
    if (!quote?.email?.trim()) return;
    const claimed = await claimSend("accepted", String(quoteId), quote.providerId);
    if (!claimed) return;

    const title = requestHeadline(quote.serviceSlug, (quote.answers ?? []) as ServiceRequestAnswer[]);
    const place = formatPlace(quote.neighborhood, quote.district, quote.city);
    const link = `${baseUrl()}/hizmet-veren/teklifler/${quoteId}`;
    const greeting = greetingName(quote.firstName ?? "", quote.lastName ?? "", quote.username);
    const html = `
      <p>Merhaba ${escapeHtml(greeting)},</p>
      <p><strong>${escapeHtml(title)}</strong> ilanındaki teklifin kabul edildi. Yer: ${escapeHtml(place)}.</p>
      <p><a href="${escapeHtml(link)}">Yazışmayı aç</a></p>
      <p style="font-size:12px;color:#64748b;">Sukull bu işten ücret almaz.</p>
    `.trim();
    const ok = await sendEmail({
      to: quote.email.trim(),
      subject: "Sukull — Teklifin kabul edildi",
      html,
      text: `${title} ilanındaki teklifin kabul edildi. ${place}. ${link}`,
    });
    if (!ok) await releaseSend("accepted", String(quoteId));
  } catch (error) {
    if (!isMissingTable(error)) {
      logger.error({ message: "Kabul e-postası gönderilemedi", error, location: LOCATION, fields: { quoteId } });
    }
  }
}

export async function digestEnabledFor(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ digestEnabled: marketplaceNotificationPrefs.digestEnabled })
    .from(marketplaceNotificationPrefs)
    .where(eq(marketplaceNotificationPrefs.userId, userId))
    .limit(1);
  return row?.digestEnabled ?? true;
}

export async function setDigestEnabled(userId: string, enabled: boolean): Promise<void> {
  await db
    .insert(marketplaceNotificationPrefs)
    .values({ userId, digestEnabled: enabled })
    .onConflictDoUpdate({
      target: marketplaceNotificationPrefs.userId,
      set: { digestEnabled: enabled },
    });
}

export async function disableDigestByToken(token: string): Promise<"ok" | "invalid"> {
  const secret = digestSecret();
  if (!secret) return "invalid";
  const userId = readDigestToken(token, secret);
  if (!userId) return "invalid";
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return "invalid";
  await setDigestEnabled(userId, false);
  return "ok";
}

function istanbulDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export async function sendMarketplaceDigests(now = new Date()): Promise<{
  sent: number;
  skipped: number;
  deferred: number;
  budgetLeft: number;
}> {
  const empty = { sent: 0, skipped: 0, deferred: 0, budgetLeft: 0 };
  try {
    const sinceDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [used] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketplaceEmailSends)
      .where(gt(marketplaceEmailSends.createdAt, sinceDay));
    const budgetLeft = Math.max(0, DAILY_MAIL_BUDGET - Number(used?.count ?? 0));
    const cap = Math.min(DIGEST_BATCH, budgetLeft);
    if (cap <= 0) return { ...empty, deferred: 1, budgetLeft };

    const candidates = await db
      .select({
        userId: providerServices.userId,
        email: users.email,
        username: users.name,
        firstName: marketplaceProfiles.firstName,
        lastName: marketplaceProfiles.lastName,
        digestEnabled: marketplaceNotificationPrefs.digestEnabled,
        lastDigestAt: marketplaceNotificationPrefs.lastDigestAt,
      })
      .from(providerServices)
      .innerJoin(users, eq(users.id, providerServices.userId))
      .leftJoin(marketplaceProfiles, eq(marketplaceProfiles.userId, providerServices.userId))
      .leftJoin(marketplaceNotificationPrefs, eq(marketplaceNotificationPrefs.userId, providerServices.userId))
      .groupBy(
        providerServices.userId,
        users.email,
        users.name,
        marketplaceProfiles.firstName,
        marketplaceProfiles.lastName,
        marketplaceNotificationPrefs.digestEnabled,
        marketplaceNotificationPrefs.lastDigestAt,
      )
      .orderBy(sql`${marketplaceNotificationPrefs.lastDigestAt} ASC NULLS FIRST`);

    let sent = 0;
    let skipped = 0;
    let deferred = 0;
    for (const candidate of candidates) {
      if (candidate.digestEnabled === false || !candidate.email?.trim()) {
        skipped += 1;
        continue;
      }
      if (!digestIsDue(candidate.lastDigestAt, now)) {
        skipped += 1;
        continue;
      }
      if (sent >= cap) {
        deferred += 1;
        continue;
      }
      const delivered = await sendOneDigest(candidate, now);
      if (delivered) sent += 1;
      else skipped += 1;
    }
    return { sent, skipped, deferred, budgetLeft: budgetLeft - sent };
  } catch (error) {
    if (isMissingTable(error)) return empty;
    throw error;
  }
}

async function sendOneDigest(
  candidate: {
    userId: string;
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    lastDigestAt: Date | null;
  },
  now: Date,
): Promise<boolean> {
  const services = await db
    .select({ serviceSlug: providerServices.serviceSlug, filters: providerServices.filters })
    .from(providerServices)
    .where(eq(providerServices.userId, candidate.userId));
  const entries = services.map((row) => ({
    slug: row.serviceSlug,
    filters: cleanFilters(row.serviceSlug, row.filters),
  }));
  const slugs = entries.map((entry) => entry.slug);
  if (slugs.length === 0) return false;
  const windowStart = digestSince(candidate.lastDigestAt, now);
  const place = await getProviderPlace(candidate.userId);

  const rows = await db
    .select({
      id: serviceRequests.id,
      serviceSlug: serviceRequests.serviceSlug,
      customerId: serviceRequests.customerId,
      answers: serviceRequests.answers,
    })
    .from(serviceRequests)
    .where(
      and(
        inArray(serviceRequests.serviceSlug, slugs),
        eq(serviceRequests.status, "open"),
        gt(serviceRequests.expiresAt, now),
        lt(serviceRequests.quoteCount, 4),
        ne(serviceRequests.customerId, candidate.userId),
        visibleToProviderSql(place.city),
        or(gt(serviceRequests.createdAt, windowStart), gt(serviceRequests.reviewedAt, windowStart)),
        sql`not exists (select 1 from service_quotes q where q.request_id = ${serviceRequests.id} and q.provider_id = ${candidate.userId})`,
      ),
    )
    .limit(40);

  const matches = pickDigestRequests(
    candidate.userId,
    entries,
    rows.map((row) => ({ ...row, answers: (row.answers ?? []) as ServiceRequestAnswer[] })),
  );
  if (matches.length === 0) return false;

  const ref = `${candidate.userId}:${istanbulDay(now)}`;
  const claimed = await claimSend("digest", ref, candidate.userId);
  if (!claimed) return false;

  const stop = unsubscribeHref(candidate.userId);
  const greeting = greetingName(candidate.firstName ?? "", candidate.lastName ?? "", candidate.username);
  const link = `${baseUrl()}/hizmet-veren/ilanlar`;
  const html = `
    <p>Merhaba ${escapeHtml(greeting)},</p>
    <p>Seçtiğin hizmetlere uyan yeni ilanlar var. Siteye girip inceleyebilirsin.</p>
    <p><a href="${escapeHtml(link)}">İlanlara git</a></p>
    <p style="font-size:12px;color:#64748b;">Bu e-posta, yeni ilan varsa 3 günde bir gelir.${
      stop ? ` <a href="${escapeHtml(stop)}">Bu e-postayı kapat</a>.` : ""
    }</p>
  `.trim();
  const ok = await sendEmail({
    to: candidate.email.trim(),
    subject: "Sukull — Yeni ilanlar var",
    html,
    text: `Seçtiğin hizmetlere uyan yeni ilanlar var. Siteye girip inceleyebilirsin. ${link}`,
  });
  if (!ok) {
    await releaseSend("digest", ref);
    return false;
  }
  await db
    .insert(marketplaceNotificationPrefs)
    .values({ userId: candidate.userId, digestEnabled: true, lastDigestAt: now })
    .onConflictDoUpdate({
      target: marketplaceNotificationPrefs.userId,
      set: { lastDigestAt: now },
    });
  return true;
}
