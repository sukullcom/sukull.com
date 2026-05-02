import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Gamepad2, Users, Trophy, GraduationCap } from "lucide-react";
import React from "react";

import { LEGAL_COMPANY } from "@/lib/legal-info";

/**
 * Marketing (public landing) footer.
 *
 * Two stacked bands:
 *   1. A feature shelf (Dersler, Oyunlar, Sıralama…) that doubles as an
 *      entry-point CTA row when the user scrolls to the page bottom.
 *   2. A legal / compliance strip with links to every document under
 *      `/yasal/*`, the company's tescilli unvan + iletişim and copyright.
 *
 * The legal strip is required for Turkish e-commerce compliance
 * (mesafeli satış, KVKK) and must be reachable from every public page.
 * That's why these links are duplicated here rather than gated behind
 * a drop-down — crawlers and auditors expect them to be always visible.
 */
export const Footer = () => {
  const year = new Date().getFullYear();
  const { legalName, contactEmail } = LEGAL_COMPANY;

  return (
    <footer className="w-full border-t-2 border-border bg-card/60">
      <div className="max-w-screen-lg mx-auto flex flex-wrap items-center justify-center gap-2 px-2 py-3 sm:justify-evenly">
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <BookOpen className="mr-2 h-5 w-5 text-suk-payment" />
          Dersler
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Gamepad2 className="mr-2 h-5 w-5 text-suk-play" />
          Beyin Oyunları
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Trophy className="mr-2 h-5 w-5 text-suk-warning" />
          Sıralama
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Users className="mr-2 h-5 w-5 text-suk-brand" />
          Çalışma Arkadaşı
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <GraduationCap className="mr-2 h-5 w-5 text-suk-danger" />
          Özel Ders
        </Button>
      </div>

      <div className="border-t border-border bg-muted/60">
        <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Yasal" className="flex flex-wrap items-center gap-x-4 gap-y-1">
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
            <Link href="/yasal/mesafeli-satis" className="hover:text-foreground hover:underline">
              Mesafeli Satış
            </Link>
            <Link href="/yasal/cayma-iade" className="hover:text-foreground hover:underline">
              Cayma &amp; İade
            </Link>
            <a href={`mailto:${contactEmail}`} className="hover:text-foreground hover:underline">
              İletişim
            </a>
          </nav>
          <p className="text-[11px] text-muted-foreground/90">
            © {year} {legalName}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
};
