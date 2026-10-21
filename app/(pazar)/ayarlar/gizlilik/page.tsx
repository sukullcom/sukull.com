import type { Metadata } from "next";
import Link from "next/link";

import { Subpage } from "@/components/marketplace/subpage";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Veri ve gizlilik" };

export default async function PrivacyPage() {
  await requireMarketAccount("/ayarlar/gizlilik");
  return (
    <Subpage title="Veri ve gizlilik" backHref="/ayarlar">
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Sukull hizmet pazaryeri ilanları listeler. Hizmet verenler bu ilanlara teklif yazar, taraflar
          mesajlaşır. Sukull ne hizmet alandan ne hizmet verenden ücret, komisyon veya teklif bedeli alır.
        </p>
        <p>
          Ad, iletişim, konum tercihi ve talep cevapların hesabına bağlıdır. İlanında hizmet verenler adını,
          soyadının baş harfini, talep ayrıntılarını ve mahalleni görür. Seçtiğin telefon veya e-posta ilanda
          görünmez; yalnızca ilanına teklif veren kişi sohbette görür.
        </p>
        <p>
          Hizmet verenlere, seçtikleri hizmetlerde yeni ilan varsa 3 günde bir özet e-posta gider. Bunu{" "}
          <Link href="/ayarlar/bildirimler" className="font-semibold text-suk-brand">
            Bildirimler
          </Link>{" "}
          sayfasından veya e-postadaki bağlantıdan kapatabilirsin. Yeni teklif ve teklif kabul e-postaları
          ayrıca gider.
        </p>
        <p>
          Ayrıntılı metinler:{" "}
          <Link href="/yasal/gizlilik" className="font-semibold text-suk-brand">
            Gizlilik
          </Link>{" "}
          ve{" "}
          <Link href="/yasal/kvkk" className="font-semibold text-suk-brand">
            KVKK
          </Link>
          .
        </p>
      </div>
    </Subpage>
  );
}
