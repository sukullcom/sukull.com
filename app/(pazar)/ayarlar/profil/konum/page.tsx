import type { Metadata } from "next";

import { LocationForm } from "@/components/marketplace/account-forms";
import { Subpage } from "@/components/marketplace/subpage";
import { getProvinces } from "@/lib/marketplace/address";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Konum" };

export default async function LocationPage() {
  const account = await requireMarketAccount("/ayarlar/profil/konum");
  const provinces = getProvinces();
  const province = provinces.find((item) => item.name === account.city);
  const district = province?.districts.find((item) => item.name === account.district);
  return (
    <Subpage title="Konum tercihleri" backHref="/ayarlar/profil">
      <LocationForm
        provinces={provinces}
        provinceId={province?.id ?? null}
        districtId={district?.id ?? null}
        neighborhood={account.neighborhood ?? ""}
      />
    </Subpage>
  );
}
