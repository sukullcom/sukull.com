import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";

import { LEGAL_COMPANY } from "@/lib/legal-info";

/**
 * Auth (login / signup / password-reset) footer.
 *
 * Two bands, both deliberately quieter than the marketing footer:
 *   1. A brand mascot row — primarily decorative, keeps the empty login
 *      screen friendly without stealing focus from the form above.
 *   2. A compact legal strip. KVKK and "Kullanım Şartları" *must* be
 *      reachable from every signup screen because Turkish consumer law
 *      requires the user to have access to these before consenting to
 *      data processing. The strip is visible on load (no interaction
 *      needed) so regulators and Lighthouse a11y both see the links.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const { legalName } = LEGAL_COMPANY;

  return (
    <footer className="w-full border-t-2 border-slate-200">
      <div className="max-w-screen-lg mx-auto flex flex-wrap items-center justify-center gap-2 px-2 py-3 sm:justify-evenly">
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Image
            src="/mascot_blue.svg"
            alt="Matematik dersi"
            height={32}
            width={40}
            className="mr-2 rounded-md"
          />
          Matematik
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Image
            src="/mascot_orange.svg"
            alt="Fen Bilimleri dersi"
            height={32}
            width={40}
            className="mr-2 rounded-md"
          />
          Fen Bilimleri
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Image
            src="/mascot_pink.svg"
            alt="Türkçe dersi"
            height={32}
            width={40}
            className="mr-2 rounded-md"
          />
          Türkçe
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Image
            src="/mascot_sad.svg"
            alt="İngilizce dersi"
            height={32}
            width={40}
            className="mr-2 rounded-md"
          />
          İngilizce
        </Button>
        <Button size="lg" variant="ghost" className="flex-shrink-0">
          <Image
            src="/mascot_bad.svg"
            alt="Daha fazla ders"
            height={32}
            width={40}
            className="mr-2 rounded-md"
          />
          ve daha fazlası...
        </Button>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/50">
        <div className="mx-auto flex w-full max-w-screen-lg flex-col items-center gap-2 px-4 py-3 text-[11px] text-slate-500 sm:flex-row sm:justify-between">
          <nav aria-label="Yasal" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link href="/yasal/kvkk" className="hover:text-slate-900 hover:underline">
              KVKK
            </Link>
            <Link href="/yasal/gizlilik" className="hover:text-slate-900 hover:underline">
              Gizlilik
            </Link>
            <Link href="/yasal/kullanim-sartlari" className="hover:text-slate-900 hover:underline">
              Kullanım Şartları
            </Link>
            <Link href="/yasal" className="hover:text-slate-900 hover:underline">
              Tüm yasal belgeler
            </Link>
          </nav>
          <p>© {year} {legalName}</p>
        </div>
      </div>
    </footer>
  );
}
