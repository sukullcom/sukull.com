import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { RequestPreviewList, type RequestPreviewItem } from "@/components/marketplace/request-preview";
import { Button } from "@/components/ui/button";
import { listProviderFeed } from "@/db/queries/marketplace";
import { formatPlace, formatWhen, publicCustomerName, requestHeadline } from "@/lib/marketplace/format";
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
        {feed.slugs.length > 0 && (
          <>
            {" "}
            Uyan yeni ilan olursa 3 günde bir kısa bir e-posta gelir.{" "}
            <Link href="/ayarlar/bildirimler" className="font-bold text-suk-brand">
              Bildirimler
            </Link>
          </>
        )}
      </p>
      {feed.slugs.length > 0 && (
        feed.place.city ? (
          <p className="mk-card flex items-start gap-2 px-4 py-3 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-suk-brand" aria-hidden />
            <span>
              Yerinde yapılan işlerde yalnızca <b>{feed.place.city}</b> ilanlarını görürsün
              {feed.place.district ? <>, {feed.place.district} ilanları en üstte</> : null}. Online ve uzaktan yapılan işler
              her şehirden gelir.{" "}
              <Link href="/ayarlar/profil/konum" className="font-bold text-suk-brand underline-offset-2 hover:underline">
                Konumu değiştir
              </Link>
            </span>
          </p>
        ) : (
          <div className="mk-card space-y-3 border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:bg-amber-950/30">
            <p>
              <b>Konumunu ekle.</b> Konum eklemeden yalnızca online ve uzaktan yapılan işleri görürsün. Yerinde yapılan işler
              (boya, temizlik, tamir gibi) bulunduğun ildeki hizmet verenlere gösterilir.
            </p>
            <Button asChild variant="primary" size="sm">
              <Link href="/ayarlar/profil/konum">Konum ekle</Link>
            </Button>
          </div>
        )
      )}
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
            place: formatPlace(request.neighborhood, request.district, request.city),
            answers: request.answers,
            href: request.mine ? `/islerim/${request.id}` : `/hizmet-veren/ilanlar/${request.id}`,
            lock: null,
          }))}
          empty="Şu an hizmetlerine uygun açık ilan yok."
        />
      )}
    </div>
  );
}
