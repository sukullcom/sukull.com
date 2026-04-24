/* eslint-disable react/no-unescaped-entities -- legal prose contains
   intentional Turkish punctuation ('..', "..") that the lint rule would
   otherwise force us to HTML-escape, making the source unreadable. */
import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Cookie,
  FileText,
  Handshake,
  Receipt,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import { LEGAL_UPDATED } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "Yasal Bilgiler | Sukull",
  description:
    "Sukull'un KVKK aydınlatma metni, gizlilik politikası, kullanım şartları, mesafeli satış sözleşmesi ve iade koşulları.",
  alternates: { canonical: "/yasal" },
  robots: { index: true, follow: true },
};

interface LegalLink {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  updatedAtKey: keyof typeof LEGAL_UPDATED;
}

const LEGAL_LINKS: readonly LegalLink[] = [
  {
    href: "/yasal/kvkk",
    title: "KVKK Aydınlatma Metni",
    description:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu bilgileri ve haklarınız.",
    icon: ShieldCheck,
    updatedAtKey: "kvkk",
  },
  {
    href: "/yasal/gizlilik",
    title: "Gizlilik Politikası",
    description:
      "Hangi verilerinizi, hangi amaçlarla işlediğimizi ve nasıl sakladığımızı anlatır.",
    icon: FileText,
    updatedAtKey: "gizlilik",
  },
  {
    href: "/yasal/cerez",
    title: "Çerez Politikası",
    description:
      "Platformda kullanılan çerez türleri ve çerez tercihlerinizi nasıl yönetebileceğiniz.",
    icon: Cookie,
    updatedAtKey: "cerez",
  },
  {
    href: "/yasal/kullanim-sartlari",
    title: "Kullanım Şartları",
    description:
      "Sukull'u kullanırken uyulacak kurallar, hak ve yükümlülükler ve uyuşmazlık hâlinde uygulanacak merciler.",
    icon: BookOpen,
    updatedAtKey: "kullanimSartlari",
  },
  {
    href: "/yasal/mesafeli-satis",
    title: "Mesafeli Satış Sözleşmesi",
    description:
      "6502 sayılı Tüketicinin Korunması Hakkında Kanun çerçevesinde ürün / hizmet satışı sözleşme metni.",
    icon: Handshake,
    updatedAtKey: "mesafeliSatis",
  },
  {
    href: "/yasal/on-bilgilendirme",
    title: "Ön Bilgilendirme Formu",
    description:
      "Satın alma öncesinde okumanız gereken yasal bilgilendirme formu.",
    icon: Receipt,
    updatedAtKey: "onBilgilendirme",
  },
  {
    href: "/yasal/cayma-iade",
    title: "Cayma Hakkı ve İade Koşulları",
    description:
      "14 günlük cayma hakkı, dijital ürünlerdeki istisnalar ve iade sürecinin işleyişi.",
    icon: RefreshCcw,
    updatedAtKey: "caymaIade",
  },
] as const;

export default function LegalIndexPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Yasal Bilgiler
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Sukull'u kullanmanıza ilişkin tüm yasal belgeler. Tebligat, KVKK
          başvurusu ve mesafeli satış koşullarını burada bulabilirsiniz.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {LEGAL_LINKS.map(({ href, title, description, icon: Icon, updatedAtKey }) => (
          <li key={href}>
            <Link
              href={href}
              className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-green-400 hover:bg-green-50/40"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-slate-100 p-2 text-slate-600 group-hover:bg-green-100 group-hover:text-green-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-slate-900 group-hover:text-green-700">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{description}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                    Son güncelleme:{" "}
                    {new Date(LEGAL_UPDATED[updatedAtKey]).toLocaleDateString(
                      "tr-TR",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
