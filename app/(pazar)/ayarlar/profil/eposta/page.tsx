import type { Metadata } from "next";

import { EmailForm } from "@/components/marketplace/account-forms";
import { Subpage } from "@/components/marketplace/subpage";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "E-posta" };

export default async function EmailPage() {
  const account = await requireMarketAccount("/ayarlar/profil/eposta");
  return (
    <Subpage title="E-posta" backHref="/ayarlar/profil">
      <EmailForm email={account.email} />
    </Subpage>
  );
}
