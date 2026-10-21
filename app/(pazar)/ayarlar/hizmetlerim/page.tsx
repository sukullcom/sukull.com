import type { Metadata } from "next";

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
      <ServicesForm selected={selected} />
    </Subpage>
  );
}
