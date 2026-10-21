import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { QuoteForm } from "@/components/marketplace/quote-actions";
import { RequestDetails } from "@/components/marketplace/request-details";
import { findProviderQuoteId, getProviderRequest } from "@/db/queries/marketplace";
import { formatPlace, formatWhen, publicCustomerName, requestCode, requestHeadline } from "@/lib/marketplace/format";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "İlan" };

export default async function ProviderListingPage({ params }: { params: { id: string } }) {
  const account = await requireMarketAccount(`/hizmet-veren/ilanlar/${params.id}`);
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const quoted = await findProviderQuoteId(account.id, id);
  if (quoted) redirect(`/hizmet-veren/teklifler/${quoted}`);
  const request = await getProviderRequest(account.id, id);
  if (!request) notFound();

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      <Link href="/hizmet-veren/ilanlar" className="text-sm font-bold text-suk-brand">
        İlanlara dön
      </Link>
      <header>
        <h1 className="text-2xl font-extrabold">
          {publicCustomerName(request.firstName ?? "", request.lastName ?? "", request.username)}
        </h1>
        <p className="font-semibold">{requestHeadline(request.serviceSlug, request.answers)}</p>
        <p className="text-sm text-muted-foreground">{formatWhen(request.timingType, request.scheduledAt)}</p>
        <p className="text-sm text-muted-foreground">
          {formatPlace(request.neighborhood, request.district, request.city)}
        </p>
        <p className="text-xs font-semibold text-muted-foreground">İlan kodu {requestCode(request.id)}</p>
      </header>
      <RequestDetails answers={request.answers} details={request.details} />
      <section className="mk-card p-4">
        <h2 className="mb-3 text-lg font-extrabold">Teklif ver</h2>
        <QuoteForm requestId={request.id} />
      </section>
    </div>
  );
}
