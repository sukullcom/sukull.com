import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChatThread } from "@/components/marketplace/chat-thread";
import { AcceptQuoteButton, ReviewForm } from "@/components/marketplace/quote-actions";
import { getCustomerJob, listProviderReviews } from "@/db/queries/marketplace";
import { getService } from "@/lib/marketplace/catalog";
import {
  chatOpen,
  formatPriceTl,
  publicCustomerName,
  quoteStatusLabel,
  requestCode,
  revealContact,
} from "@/lib/marketplace/format";
import { requireMarketAccount } from "@/lib/marketplace/session";
import { MarketAvatar } from "@/components/marketplace/market-avatar";
import { RatingBadge, Stars } from "@/components/marketplace/rating-badge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Teklif sohbeti" };

const REVIEW_PREVIEW = 5;

export default async function CustomerQuotePage({ params }: { params: { id: string; quoteId: string } }) {
  const account = await requireMarketAccount(`/islerim/${params.id}/teklif/${params.quoteId}`);
  const id = Number(params.id);
  const quoteId = Number(params.quoteId);
  if (!Number.isInteger(id) || !Number.isInteger(quoteId)) notFound();
  const job = await getCustomerJob(account.id, id);
  const quote = job?.quotes.find((item) => item.id === quoteId);
  if (!job || !quote) notFound();

  const name = publicCustomerName(quote.firstName ?? "", quote.lastName ?? "", quote.username);
  const reviews = quote.rating.count > 0 ? (await listProviderReviews(quote.providerId)).slice(0, REVIEW_PREVIEW) : [];
  const contact = revealContact(job.contactChannel, account.phone, account.email);
  const open = job.status === "open" && job.expiresAt.getTime() > Date.now();
  const otherQuotes = job.quotes.filter((item) => item.id !== quote.id && item.status === "pending").length;
  const closedNote = chatOpen({ quoteStatus: quote.status, requestStatus: job.status, expiresAt: job.expiresAt })
    ? null
    : quote.status === "rejected"
      ? "Bu teklif kabul edilmediği için yazışma kapandı."
      : "İlan kapandığı için bu yazışma kapandı.";

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      <Link href={`/islerim/${job.id}`} className="text-sm font-bold text-suk-brand">
        Tekliflere dön
      </Link>
      <header className="mk-card flex items-center gap-3 p-4">
        <MarketAvatar src={quote.avatar} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold">{name}</h1>
          <p className="text-sm text-muted-foreground">
            {getService(job.serviceSlug)?.name ?? job.serviceSlug} · {requestCode(job.id)}
          </p>
          <RatingBadge average={quote.rating.average} count={quote.rating.count} className="mt-0.5" />
          <p className="text-xs font-semibold text-muted-foreground">{quoteStatusLabel(quote.status)}</p>
        </div>
        <p className="shrink-0 text-xl font-extrabold text-suk-brand">{formatPriceTl(quote.priceTl)}</p>
      </header>

      {quote.message && (
        <section className="mk-card p-4 text-sm">
          <p className="text-muted-foreground">Teklif mesajı</p>
          <p className="mt-1 whitespace-pre-wrap font-semibold">{quote.message}</p>
        </section>
      )}

      {contact && (
        <p className="rounded-2xl border-2 border-dashed border-border px-4 py-3 text-sm">
          <span className="block text-muted-foreground">{name} senin bu bilgini görüyor</span>
          <span className="font-semibold">
            {contact.label}: {contact.value}
          </span>
        </p>
      )}

      {reviews.length > 0 && (
        <details className="mk-card group p-4 text-sm">
          <summary className="cursor-pointer list-none font-bold">
            <span className="group-open:hidden">Değerlendirmeleri göster ({quote.rating.count})</span>
            <span className="hidden group-open:inline">Değerlendirmeleri gizle</span>
          </summary>
          <ul className="mt-3 space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    {publicCustomerName(review.firstName ?? "", review.lastName ?? "", review.username)}
                  </span>
                  <Stars value={review.stars} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {getService(review.serviceSlug)?.name ?? review.serviceSlug} ·{" "}
                  {review.createdAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                {review.body && <p className="mt-1 whitespace-pre-wrap">{review.body}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {open && quote.status === "pending" && <AcceptQuoteButton quoteId={quote.id} otherQuotes={otherQuotes} />}

      <ChatThread
        quoteId={quote.id}
        viewerId={account.id}
        otherName={name}
        otherAvatar={quote.avatar}
        messages={quote.messages}
        closedNote={closedNote}
      />

      {quote.status === "accepted" && !quote.review && (
        <section className="mk-card p-4">
          <ReviewForm quoteId={quote.id} />
        </section>
      )}
      {quote.review && (
        <p className="mk-card p-4 text-sm text-muted-foreground">
          Puanın: {quote.review.stars}/5 {quote.review.body}
        </p>
      )}
    </div>
  );
}
