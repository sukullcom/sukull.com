import type { Metadata } from "next";
import Link from "next/link";

import { AvatarUploader } from "@/components/marketplace/avatar-uploader";
import { Subpage } from "@/components/marketplace/subpage";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profilim" };

export default async function ProfilePage() {
  const account = await requireMarketAccount("/ayarlar/profil");
  const fullName = [account.firstName, account.lastName].filter(Boolean).join(" ") || account.username;
  const place = [account.neighborhood, account.district, account.city].filter(Boolean).join(", ");
  const rows = [
    { href: "/ayarlar/profil/ad-soyad", label: "Ad soyad", value: fullName },
    { href: "/ayarlar/profil/eposta", label: "E-posta", value: account.email },
    { href: "/ayarlar/profil/telefon", label: "Cep telefonu", value: account.phone || "Ekle" },
    { href: "/ayarlar/profil/konum", label: "Konum tercihleri", value: place || "Ekle" },
  ];

  return (
    <Subpage title="Profilim" backHref="/ayarlar">
      <div className="mb-6">
        <AvatarUploader src={account.avatar ?? ""} />
      </div>
      <div className="mk-card overflow-hidden">
        {rows.map((row) => (
          <Link key={row.href} href={row.href} className="block border-b-2 border-border px-4 py-4 last:border-b-0 hover:bg-muted/50 active:transform-none active:bg-muted">
            <span className="block text-sm text-muted-foreground">{row.label}</span>
            <span className="font-semibold">{row.value}</span>
          </Link>
        ))}
      </div>
    </Subpage>
  );
}
