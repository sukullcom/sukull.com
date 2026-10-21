"use client";

import Link from "next/link";

import { LEGAL_COMPANY } from "@/lib/legal-info";

/**
 * Auth footer. Yasal bağlantılar kayıt onayından önce görünür kalır.
 * Ders maskotları burada yok; giriş pazaryeri hesabı içindir.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const { brandName } = LEGAL_COMPANY;

  return (
    <footer className="w-full border-t border-border">
      <p className="px-4 py-3 text-center text-sm text-muted-foreground">
        İlan açmak ve teklif vermek ücretsizdir.
      </p>
      <div className="border-t border-border bg-muted/50">
        <div className="mx-auto flex w-full max-w-screen-lg flex-col items-center gap-2 px-4 py-3 text-[11px] text-muted-foreground sm:flex-row sm:justify-between">
          <nav aria-label="Yasal" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link href="/hakkimizda" className="hover:text-foreground hover:underline">
              Hakkımızda
            </Link>
            <Link href="/yasal/kvkk" className="hover:text-foreground hover:underline">
              KVKK
            </Link>
            <Link href="/yasal/gizlilik" className="hover:text-foreground hover:underline">
              Gizlilik
            </Link>
            <Link href="/yasal/kullanim-sartlari" className="hover:text-foreground hover:underline">
              Kullanım Şartları
            </Link>
            <Link href="/yasal" className="hover:text-foreground hover:underline">
              Tüm yasal belgeler
            </Link>
          </nav>
          <p className="shrink-0">© {year} {brandName}. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
