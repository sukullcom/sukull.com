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
    <footer className="w-full border-t-2 border-slate-200 bg-white/60">
      <div className="max-w-screen-lg mx-auto flex flex-wrap items-center justify-center gap-2 px-2 py-3 sm:justify-evenly">
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <BookOpen className="h-5 w-5 mr-2 text-sky-500" />
          Dersler
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Gamepad2 className="h-5 w-5 mr-2 text-violet-500" />
          Beyin Oyunları
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Trophy className="h-5 w-5 mr-2 text-amber-500" />
          Sıralama
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Users className="h-5 w-5 mr-2 text-emerald-500" />
          Çalışma Arkadaşı
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <GraduationCap className="h-5 w-5 mr-2 text-rose-500" />
          Özel Ders
        </Button>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/60">
        <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-3 px-4 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Yasal" className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/yasal/kvkk" className="hover:text-slate-900 hover:underline">
              KVKK
            </Link>
            <Link href="/yasal/gizlilik" className="hover:text-slate-900 hover:underline">
              Gizlilik
            </Link>
            <Link href="/yasal/cerez" className="hover:text-slate-900 hover:underline">
              Çerez
            </Link>
            <Link href="/yasal/kullanim-sartlari" className="hover:text-slate-900 hover:underline">
              Kullanım Şartları
            </Link>
            <Link href="/yasal/mesafeli-satis" className="hover:text-slate-900 hover:underline">
              Mesafeli Satış
            </Link>
            <Link href="/yasal/cayma-iade" className="hover:text-slate-900 hover:underline">
              Cayma &amp; İade
            </Link>
            <a href={`mailto:${contactEmail}`} className="hover:text-slate-900 hover:underline">
              İletişim
            </a>
          </nav>
          <p className="text-[11px] text-slate-500">
            © {year} {legalName}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
};
