import type { Metadata } from "next";
import Link from "next/link";

import { RequestPreviewList, type RequestPreviewItem } from "@/components/marketplace/request-preview";
import { Button } from "@/components/ui/button";
import { listProviderFeed } from "@/db/queries/marketplace";
import { formatWhen, publicCustomerName, requestHeadline } from "@/lib/marketplace/format";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "İlanlar" };

export default async function ProviderListingsPage() {
  const account = await requireMarketAccount("/hizmet-veren/ilanlar");
  const feed = await listProviderFeed(account.id);

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <h1 className="text-2xl font-extrabold">İlanlar</h1>
      <p className="text-sm text-muted-foreground">
        Yalnızca Hizmetlerim listene eklediğin işler burada görünür. Bir talebe en fazla 4 teklif gelir.
        Hizmetlerim sayfasından her hizmet için detay seçersen sadece uyan ilanları görürsün. Kendi talebin İlanlarım&apos;da durur.
      </p>
      {feed.slugs.length === 0 ? (
        <div className="mk-empty">
          <p>Henüz hizmet eklemedin.</p>
          <Button asChild variant="primary" className="mt-4">
            <Link href="/ayarlar/hizmetlerim">Hizmet ekle</Link>
          </Button>
        </div>
      ) : feed.requests.length === 0 ? (
        <p className="mk-empty">
          Şu an hizmetlerine uygun açık ilan yok.
        </p>
      ) : (
        <RequestPreviewList
          items={feed.requests.map((request): RequestPreviewItem => ({
            id: request.id,
            name: request.mine
              ? "Senin talebin"
              : publicCustomerName(request.firstName ?? "", request.lastName ?? "", request.username),
            title: requestHeadline(request.serviceSlug, request.answers),
            details: request.details,
            when: formatWhen(request.timingType, request.scheduledAt),
            href: request.mine ? `/islerim/${request.id}` : `/hizmet-veren/ilanlar/${request.id}`,
            lock: null,
          }))}
          empty="Şu an hizmetlerine uygun açık ilan yok."
        />
      )}
    </div>
  );
}
