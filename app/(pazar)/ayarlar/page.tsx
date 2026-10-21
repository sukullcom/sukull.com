import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { AvatarUploader } from "@/components/marketplace/avatar-uploader";
import { LogoutButton } from "@/components/marketplace/logout-button";
import { greetingName } from "@/lib/marketplace/format";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const account = await requireMarketAccount("/ayarlar");
  const jar = await cookies();
  const provider = jar.get("sk_market_mode")?.value === "provider";
  const hello = greetingName(account.firstName ?? "", account.lastName ?? "", account.username);

  const links = [
    { href: "/ayarlar/profil", label: "Profilim" },
    ...(provider
      ? [
          { href: "/ayarlar/hizmetlerim", label: "Hizmetlerim" },
          { href: "/ayarlar/yorumlar", label: "Müşteri yorumları" },
        ]
      : []),
    { href: "/ayarlar/bildirimler", label: "Bildirimler" },
    { href: "/ayarlar/sifre", label: "Şifre değiştir" },
    { href: "/ayarlar/tavsiye", label: provider ? "Uygulamayı tavsiye et" : "Arkadaşlarına tavsiye et" },
    { href: "/ayarlar/gizlilik", label: "Veri ve gizlilik" },
  ];

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <AvatarUploader src={account.avatar ?? ""} />
        <h1 className="text-2xl font-extrabold">Merhaba, {hello}</h1>
      </div>
      <div className="mk-card overflow-hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-14 items-center justify-between gap-3 border-b-2 border-border px-4 py-4 font-semibold last:border-b-0 hover:bg-muted/50 active:transform-none active:bg-muted"
          >
            {link.label}
            <span className="text-lg leading-none text-muted-foreground" aria-hidden>
              ›
            </span>
          </Link>
        ))}
        <LogoutButton />
      </div>
    </div>
  );
}
