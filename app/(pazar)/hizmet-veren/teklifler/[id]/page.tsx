import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChatThread } from "@/components/marketplace/chat-thread";
import { RequestDetails } from "@/components/marketplace/request-details";
import { getProviderQuoteThread } from "@/db/queries/marketplace";
import { getService } from "@/lib/marketplace/catalog";
import {
  chatOpen,
  formatPlace,
  formatPriceTl,
  formatWhen,
  providerQuoteLabel,
  publicCustomerName,
  requestCode,
  revealContact,
} from "@/lib/marketplace/format";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Teklif" };

export default async function ProviderQuotePage({ params }: { params: { id: string } }) {
  const account = await requireMarketAccount(`/hizmet-veren/teklifler/${params.id}`);
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const thread = await getProviderQuoteThread(account.id, id);
  if (!thread?.request) notFound();
  const contact = revealContact(thread.request.contactChannel, thread.request.phone, thread.request.email);
  const customer = publicCustomerName(thread.request.firstName ?? "", thread.request.lastName ?? "", thread.request.username);
  const state = {
    quoteStatus: thread.quote.status,
    requestStatus: thread.request.status,
    expiresAt: thread.request.expiresAt,
  };
  const closedNote = chatOpen(state)
    ? null
    : thread.quote.status === "rejected"
      ? "Müşteri başka bir teklifi seçti. Bu yazışma kapandı."
      : "İlan kapandığı için bu yazışma kapandı.";

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      <Link href="/hizmet-veren/teklifler" className="text-sm font-bold text-suk-brand">
        Tekliflerime dön
      </Link>
      <header className="mk-card space-y-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-extrabold">{customer}</h1>
          <p className="shrink-0 text-xl font-extrabold text-suk-brand">{formatPriceTl(thread.quote.priceTl)}</p>
        </div>
        <p className="font-semibold">{getService(thread.request.serviceSlug)?.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatWhen(thread.request.timingType, thread.request.scheduledAt)} · {requestCode(thread.request.id)}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatPlace(thread.request.neighborhood, thread.request.district, thread.request.city)}
        </p>
        <p className="text-xs font-semibold text-muted-foreground">{providerQuoteLabel(state)}</p>
      </header>
      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-bold text-suk-brand">
          <span className="group-open:hidden">İlan detaylarını göster</span>
          <span className="hidden group-open:inline">İlan detaylarını gizle</span>
        </summary>
        <div className="mt-3">
          <RequestDetails answers={thread.request.answers} details={thread.request.details} />
        </div>
      </details>
      {contact && (
        <p className="rounded-2xl border-2 border-dashed border-suk-brand/40 bg-suk-brand-soft px-4 py-3 text-sm">
          <span className="block text-muted-foreground">İletişim tercihi</span>
          <span className="font-semibold">
            {contact.label}: {contact.value}
          </span>
        </p>
      )}
      <ChatThread quoteId={thread.quote.id} viewerId={account.id} otherName={customer}
        otherAvatar={thread.request.avatar}
        messages={thread.messages} closedNote={closedNote} />
    </div>
  );
}
