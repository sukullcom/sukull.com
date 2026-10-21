import type { Metadata } from "next";

import { PhoneForm } from "@/components/marketplace/account-forms";
import { Subpage } from "@/components/marketplace/subpage";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cep telefonu" };

export default async function PhonePage() {
  const account = await requireMarketAccount("/ayarlar/profil/telefon");
  return (
    <Subpage title="Cep telefonu" backHref="/ayarlar/profil">
      <PhoneForm phone={account.phone ?? ""} />
    </Subpage>
  );
}
