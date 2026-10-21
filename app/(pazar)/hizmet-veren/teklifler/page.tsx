import type { Metadata } from "next";
import Link from "next/link";

import { listProviderQuotes } from "@/db/queries/marketplace";
import { getService } from "@/lib/marketplace/catalog";
import { formatPriceTl, formatWhen, providerQuoteLabel, publicCustomerName } from "@/lib/marketplace/format";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tekliflerim" };

export default async function ProviderQuotesPage() {
  const account = await requireMarketAccount("/hizmet-veren/teklifler");
  const quotes = await listProviderQuotes(account.id);

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <h1 className="text-2xl font-extrabold">Tekliflerim</h1>
      {quotes.length === 0 ? (
        <div className="mk-empty">
          <p className="font-semibold text-foreground">Henüz teklif vermedin.</p>
          <p className="mt-2 text-sm">İlanlar listesinden bir talebe fiyat ve mesaj yaz.</p>
          <Link href="/hizmet-veren/ilanlar" className="mt-3 inline-block text-sm font-bold text-suk-brand">
            İlanlara git
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {quotes.map((quote) => (
            <li key={quote.id}>
              <Link href={`/hizmet-veren/teklifler/${quote.id}`} className="mk-card-press min-h-[108px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {publicCustomerName(quote.firstName ?? "", quote.lastName ?? "", quote.username)}
                    </p>
                    <p className="text-sm">{getService(quote.serviceSlug)?.name}</p>
                    <p className="text-sm text-muted-foreground">{formatWhen(quote.timingType, quote.scheduledAt)}</p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold text-suk-brand">{formatPriceTl(quote.priceTl)}</p>
                </div>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">{providerQuoteLabel({ quoteStatus: quote.status, requestStatus: quote.requestStatus, expiresAt: quote.expiresAt })}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
