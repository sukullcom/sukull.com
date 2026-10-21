import type { Metadata } from "next";

import { ServiceSearch } from "@/components/marketplace/service-search";
import { RequestPreviewList, type RequestPreviewItem } from "@/components/marketplace/request-preview";
import { ReviewShowcase } from "@/components/marketplace/review-showcase";
import { listOpenRequestPreviews } from "@/db/queries/marketplace";
import { getServerUser } from "@/lib/auth";
import { formatWhen, publicCustomerName, requestHeadline } from "@/lib/marketplace/format";
import { SHOWCASE_REQUESTS, SHOWCASE_REVIEWS, showcaseWhen } from "@/lib/marketplace/showcase";

export const metadata: Metadata = {
  title: "Hizmet al",
  description: "Sukull'da ihtiyacın olan hizmeti seç, talep aç ve teklifleri karşılaştır. Ücret yok.",
};

export const dynamic = "force-dynamic";

const PREVIEW_LIMIT = 8;

export default async function MarketplaceHomePage() {
  const user = await getServerUser();
  if (user) return <ServiceSearch />;

  const rows = await listOpenRequestPreviews(PREVIEW_LIMIT);
  const realItems: RequestPreviewItem[] = rows.map((row) => ({
    id: row.id,
    name: publicCustomerName(row.firstName ?? "", row.lastName ?? "", row.username),
    title: requestHeadline(row.serviceSlug, row.answers),
    details: row.details,
    when: formatWhen(row.timingType, row.scheduledAt),
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
    href: null,
    lock: "account",
  }));

  return (
    <div className="space-y-10">
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
      <ReviewShowcase reviews={SHOWCASE_REVIEWS} />
    </div>
  );
}
