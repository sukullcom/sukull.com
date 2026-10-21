import type { Metadata } from "next";

import { PasswordForm } from "@/components/marketplace/account-forms";
import { Subpage } from "@/components/marketplace/subpage";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Şifre değiştir" };

export default async function PasswordPage() {
  await requireMarketAccount("/ayarlar/sifre");
  return (
    <Subpage title="Şifre değiştir" backHref="/ayarlar">
      <PasswordForm />
    </Subpage>
  );
}
