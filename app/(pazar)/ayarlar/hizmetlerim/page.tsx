import type { Metadata } from "next";
import Link from "next/link";

import { ServicesForm } from "@/components/marketplace/services-form";
import { Subpage } from "@/components/marketplace/subpage";
import { listProviderServiceEntries } from "@/db/queries/marketplace";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Hizmetlerim" };

export default async function ServicesPage() {
  const account = await requireMarketAccount("/ayarlar/hizmetlerim");
  const selected = await listProviderServiceEntries(account.id);
  return (
    <Subpage title="Hizmetlerim" backHref="/ayarlar">
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        Seçtiğin işlere uyan yeni ilan olursa 3 günde bir kısa bir e-posta gelir. İlanlar mailde yazılmaz, siteye
        girince görürsün. İlan yoksa mail gitmez.{" "}
        <Link href="/ayarlar/bildirimler" className="font-bold text-suk-brand">
          Bunu kapatabilirsin.
        </Link>
      </p>
      <ServicesForm selected={selected} />
    </Subpage>
  );
}
