import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MessageCircle } from "lucide-react";

import { getCustomerJob } from "@/db/queries/marketplace";
import { getService } from "@/lib/marketplace/catalog";
import {
  clipText,
  formatPlace,
  formatPriceTl,
  formatWhen,
  publicCustomerName,
  quoteStatusLabel,
  requestCode,
  requestState,
} from "@/lib/marketplace/format";
import { StatusDot } from "@/components/marketplace/status-dot";
import { CloseRequestButton } from "@/components/marketplace/quote-actions";
import { requireMarketAccount } from "@/lib/marketplace/session";
import { MarketAvatar } from "@/components/marketplace/market-avatar";
import { RatingBadge } from "@/components/marketplace/rating-badge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "İlanım" };

function mailTarget(email: string | null | undefined): string {
  const value = email?.trim();
  return value ? `${value} adresine` : "hesabındaki e-posta adresine";
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const account = await requireMarketAccount(`/islerim/${params.id}`);
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const job = await getCustomerJob(account.id, id);
  if (!job) notFound();
  const serviceName = getService(job.serviceSlug)?.name ?? job.serviceSlug;
  const state = requestState(job);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <Link href="/islerim" className="text-sm font-bold text-suk-brand">
        İlanlarıma dön
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold">{serviceName}</h1>
        <p className="text-sm text-muted-foreground">
          {formatWhen(job.timingType, job.scheduledAt)} ·{" "}
          {formatPlace(job.neighborhood, job.district, job.city)}
        </p>
        <p className="text-xs font-semibold text-muted-foreground">
          İlan kodu {requestCode(job.id)}
        </p>
        <div className="pt-1">
          <StatusDot tone={state.tone} label={state.label} />
        </div>
      </header>
      {job.status === "pending" && (
        <p className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          İlanın inceleniyor. Onaylanınca hizmet verenler görür ve teklif gönderebilir. Teklif gelince{" "}
          {mailTarget(account.email)} haber veririz.
        </p>
      )}
      {job.status === "rejected" && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-bold">İlanın yayınlanmadı</p>
          {job.rejectionNote && (
            <p className="mt-1 whitespace-pre-wrap">{job.rejectionNote}</p>
          )}
          <p className="mt-2 text-red-800">
            Gerekli düzeltmeyi yapıp yeni bir talep oluşturabilirsin.
          </p>
          <Link
            href={`/talep/yeni?hizmet=${encodeURIComponent(job.serviceSlug)}`}
            className="mt-3 inline-block font-bold text-red-900 underline underline-offset-2"
          >
            Yeni ilan oluştur
          </Link>
        </div>
      )}
      <section className="mk-card space-y-3 p-4 text-sm">
        {job.answers.map((answer) => (
          <p key={answer.id}>
            <span className="block text-muted-foreground">{answer.prompt}</span>
            <span className="font-semibold">{answer.answer}</span>
          </p>
        ))}
        <p>
          <span className="block text-muted-foreground">
            İhtiyacın detayları
          </span>
          <span className="whitespace-pre-wrap font-semibold">
            {job.details}
          </span>
        </p>
      </section>
      {(job.quotes.length > 0 ||
        (job.status !== "pending" && job.status !== "rejected")) && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-extrabold">Teklifler</h2>
            {job.status === "open" && (
              <p className="text-sm text-muted-foreground">
                Yeni teklif gelince {mailTarget(account.email)} haber veririz.
                {job.quotes.length > 0 ? " Bir teklife dokun, o kişiyle ayrı sohbet açılır." : ""}
              </p>
            )}
            {job.status !== "open" && job.quotes.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Bir teklife dokun, o kişiyle ayrı sohbet açılır.
              </p>
            )}
          </div>
          {job.quotes.length === 0 && (
            <p className="mk-empty text-sm">Henüz teklif gelmedi.</p>
          )}
          <ul className="space-y-3">
            {job.quotes.map((quote) => {
              const name = publicCustomerName(
                quote.firstName ?? "",
                quote.lastName ?? "",
                quote.username,
              );
              const last = quote.messages[quote.messages.length - 1];
              const preview = last ? last.body : quote.message;
              return (
                <li key={quote.id}>
                  <Link
                    href={`/islerim/${job.id}/teklif/${quote.id}`}
                    className="mk-card-press flex items-center gap-3 p-4"
                  >
                    <MarketAvatar src={quote.avatar} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-bold">{name}</p>
                        <p className="shrink-0 text-lg font-extrabold text-suk-brand">
                          {formatPriceTl(quote.priceTl)}
                        </p>
                      </div>
                      <RatingBadge average={quote.rating.average} count={quote.rating.count} />
                      <p className="text-xs font-semibold text-muted-foreground">
                        {quoteStatusLabel(quote.status)}
                      </p>
                      {preview && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {clipText(preview, 80)}
                        </p>
                      )}
                      <p className="mt-1 flex items-center gap-1 text-xs font-bold text-suk-brand">
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                        {quote.messages.length > 0
                          ? `${quote.messages.length} mesaj`
                          : "Sohbeti aç"}
                      </p>
                    </div>
                    <ChevronRight
                      className="h-5 w-5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {(job.status === "pending" || job.status === "open") && !state.expired && (
        <CloseRequestButton requestId={job.id} />
      )}
    </div>
  );
}
