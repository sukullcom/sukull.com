import type { Metadata } from "next";
import Link from "next/link";

import { disableDigestByToken } from "@/lib/marketplace/notify";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "İlan özeti", robots: { index: false, follow: false } };

export default async function UnsubscribeDigestPage({ searchParams }: { searchParams?: { token?: string } }) {
  const result = await disableDigestByToken(searchParams?.token ?? "");
  const ok = result === "ok";

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-2xl font-extrabold">{ok ? "İlan özeti kapatıldı" : "Bağlantı geçersiz"}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {ok
          ? "Sana uygun yeni ilanlar artık e-posta ile gelmez. Teklif ve kabul mailleri gelmeye devam eder. İstersen Ayarlar’dan yeniden açabilirsin."
          : "Bu kapatma bağlantısının süresi dolmuş ya da bozuk. Hesabına girip Ayarlar → Bildirimler sayfasından kapatabilirsin."}
      </p>
      <Link href={ok ? "/ayarlar/bildirimler" : "/login?next=/ayarlar/bildirimler"} className="mt-6 inline-block font-bold text-suk-brand">
        Bildirim ayarları
      </Link>
    </div>
  );
}
