import type { Metadata } from "next";

import { NameForm } from "@/components/marketplace/account-forms";
import { Subpage } from "@/components/marketplace/subpage";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ad soyad" };

export default async function NamePage() {
  const account = await requireMarketAccount("/ayarlar/profil/ad-soyad");
  return (
    <Subpage title="Adın soyadın" backHref="/ayarlar/profil">
      <NameForm firstName={account.firstName ?? ""} lastName={account.lastName ?? ""} />
    </Subpage>
  );
}
