"use client";

import Link from "next/link";
import React from "react";

import { LEGAL_COMPANY } from "@/lib/legal-info";

/**
 * Footer for public legal pages. Marketplace home has its own links.
 * Distance-sale documents stay on the checkout screens; they are not
 * sitewide navigation, so search engines do not treat them as sitelinks.
 */
export const Footer = () => {
  const year = new Date().getFullYear();
  const { brandName, contactEmail } = LEGAL_COMPANY;

  return (
    <footer className="w-full border-t-2 border-border bg-card/60">
      <div className="bg-muted/60">
        <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Yasal" className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/hizmet" className="hover:text-foreground hover:underline">
              Hizmet ara
            </Link>
            <Link href="/hakkimizda" className="hover:text-foreground hover:underline">
              Hakkımızda
            </Link>
            <Link href="/yasal/kvkk" className="hover:text-foreground hover:underline">
              KVKK
            </Link>
            <Link href="/yasal/gizlilik" className="hover:text-foreground hover:underline">
              Gizlilik
            </Link>
            <Link href="/yasal/cerez" className="hover:text-foreground hover:underline">
              Çerez
            </Link>
            <Link href="/yasal/kullanim-sartlari" className="hover:text-foreground hover:underline">
              Kullanım Şartları
            </Link>
            <a href={`mailto:${contactEmail}`} className="hover:text-foreground hover:underline">
              İletişim
            </a>
          </nav>
          <p className="text-[11px] text-muted-foreground/90 sm:text-right">
            © <span suppressHydrationWarning>{year}</span> {brandName}. Tüm hakları
            saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
};
