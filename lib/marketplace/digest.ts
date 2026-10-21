import type { ProviderServiceEntry } from "@/lib/marketplace/provider-match";
import { requestMatchesEntry } from "@/lib/marketplace/provider-match";

export const DIGEST_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

/** Özet, son gönderimden 3 gün geçmeden tekrar gitmez. Hiç gitmediyse sıradadır. */
export function digestIsDue(lastDigestAt: Date | null, now: Date): boolean {
  if (!lastDigestAt) return true;
  return now.getTime() - lastDigestAt.getTime() >= DIGEST_INTERVAL_MS;
}

/**
 * İlk özette yalnızca son 3 gün. Sonraki özette, arada kalan ilanlar da girer.
 */
export function digestSince(lastDigestAt: Date | null, now: Date): Date {
  const threeDaysAgo = new Date(now.getTime() - DIGEST_INTERVAL_MS);
  if (!lastDigestAt || lastDigestAt.getTime() > now.getTime()) return threeDaysAgo;
  return lastDigestAt;
}

type DigestRow = {
  id: number;
  serviceSlug: string;
  customerId: string;
  answers: { id: string; answer: string }[];
};

export function pickDigestRequests<T extends DigestRow>(
  providerId: string,
  entries: ProviderServiceEntry[],
  rows: T[],
): T[] {
  const filters = new Map(entries.map((entry) => [entry.slug, entry.filters]));
  return rows.filter(
    (row) =>
      row.customerId !== providerId &&
      filters.has(row.serviceSlug) &&
      requestMatchesEntry(row.serviceSlug, filters.get(row.serviceSlug), row.answers),
  );
}
