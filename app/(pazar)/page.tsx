import type { Metadata } from "next";

import { ServiceSearch } from "@/components/marketplace/service-search";
import { RequestPreviewList, type RequestPreviewItem } from "@/components/marketplace/request-preview";
import { ReviewShowcase } from "@/components/marketplace/review-showcase";
import { listOpenRequestPreviews, listPublicReviews } from "@/db/queries/marketplace";
import { getServerUser } from "@/lib/auth";
import { getService } from "@/lib/marketplace/catalog";
import { formatPlace, formatWhen, publicCustomerName, requestHeadline } from "@/lib/marketplace/format";
import { SHOWCASE_REQUESTS, SHOWCASE_REVIEWS, showcaseWhen, type ShowcaseReview } from "@/lib/marketplace/showcase";
import { MARKET_ORIGIN, faqJsonLd, websiteJsonLd } from "@/lib/marketplace/seo";
import { JsonLd } from "@/components/marketplace/json-ld";

export const metadata: Metadata = {
  title: "Hizmet al",
  description: "İhtiyacın olan hizmeti seç, ücretsiz ilan aç, teklifleri karşılaştır. Sukull komisyon almaz.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hizmet al | Sukull",
    description: "Ücretsiz ilan aç, en fazla dört teklif karşılaştır. Komisyon yok.",
    url: MARKET_ORIGIN,
  },
};

export const dynamic = "force-dynamic";

const PREVIEW_LIMIT = 8;
const REVIEW_LIMIT = 9;

export default async function MarketplaceHomePage() {
  const user = await getServerUser();
  if (user) return <ServiceSearch />;

  const [rows, reviewRows] = await Promise.all([listOpenRequestPreviews(PREVIEW_LIMIT), listPublicReviews(REVIEW_LIMIT)]);
  const realItems: RequestPreviewItem[] = rows.map((row) => ({
    id: row.id,
    name: publicCustomerName(row.firstName ?? "", row.lastName ?? "", row.username),
    title: requestHeadline(row.serviceSlug, row.answers),
    details: row.details,
    when: formatWhen(row.timingType, row.scheduledAt),
    place: formatPlace("", row.district, row.city),
    answers: row.answers,
    href: null,
    lock: "account",
  }));
  const showcaseItems: RequestPreviewItem[] = SHOWCASE_REQUESTS.slice(
    0,
    Math.max(0, PREVIEW_LIMIT - realItems.length),
  ).map((request, index) => ({
    id: -(index + 1),
    name: request.name,
    title: request.title,
    details: request.details,
    when: showcaseWhen(request),
    place: request.place,
    answers: request.answers,
    href: null,
    lock: "account",
  }));

  const realReviews: ShowcaseReview[] = reviewRows.map((row) => ({
    name: publicCustomerName(row.firstName ?? "", row.lastName ?? "", row.username),
    place: formatPlace("", row.district, row.city),
    service: getService(row.serviceSlug)?.name ?? "Hizmet",
    rating: row.stars,
    text: row.body.trim(),
  }));
  const reviews = [...realReviews, ...SHOWCASE_REVIEWS].slice(0, Math.max(REVIEW_LIMIT, realReviews.length));

  return (
    <div className="space-y-10">
      <JsonLd data={[websiteJsonLd(), faqJsonLd()]} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.85fr)]">
        <ServiceSearch />
        <aside className="space-y-3 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Açık ilanlar</h2>
          <p className="text-sm text-muted-foreground">
            Kayıt olmadan ilanın bir kısmını görebilirsin. Detay için hesap gerekir.
          </p>
          <RequestPreviewList items={[...realItems, ...showcaseItems]} empty="Şu an görünen açık ilan yok." />
        </aside>
      </div>
      <ReviewShowcase reviews={reviews} />
    </div>
  );
}
