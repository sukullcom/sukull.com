import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

import { LEGAL_COMPANY } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "Hakkımızda | Sukull",
  description:
    "Sukull, hizmet almak isteyenlerle hizmet verenleri komisyonsuz buluşturan ücretsiz ilan platformudur.",
  alternates: { canonical: "/hakkimizda" },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  const c = LEGAL_COMPANY;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Hakkımızda</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          <strong className="text-foreground">{c.brandName}</strong>, ihtiyacın olan hizmet için
          ücretsiz ilan açtığın ve hizmet verenlerden teklif aldığın bir platformdur. Temizlik,
          tadilat, tamir, nakliyat ve benzeri işlerde komisyon alınmaz.
        </p>
      </header>

      <div className="space-y-10">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Nasıl çalışır?</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground marker:text-suk-brand">
            <li>Hizmeti seçip birkaç soruyu cevaplarsın</li>
            <li>İlanın, aynı ildeki hizmet verenlere açılır</li>
            <li>Gelen teklifleri karşılaştırıp anlaştığın kişiyle devam edersin</li>
            <li>İlan açmak ve teklif göndermek ücretsizdir</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/hizmet"
              className="inline-flex items-center justify-center rounded-xl bg-suk-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-suk-brand-hover"
            >
              Hizmet ara
            </Link>
            <Link
              href="/hizmet-ver"
              className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Hizmet ver
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">İletişim</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            İşletme: <strong className="text-foreground">{c.legalName}</strong>
          </p>
          <a
            href={`mailto:${c.contactEmail}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-suk-brand hover:underline"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            {c.contactEmail}
          </a>
          <p className="mt-4 text-xs text-muted-foreground">
            KVKK başvuruları:{" "}
            <a className="font-medium text-suk-brand hover:underline" href={`mailto:${c.kvkkEmail}`}>
              {c.kvkkEmail}
            </a>
            {" · "}
            <Link href="/yasal/kvkk" className="font-medium text-suk-brand hover:underline">
              KVKK
            </Link>
            {" · "}
            <Link href="/yasal/gizlilik" className="font-medium text-suk-brand hover:underline">
              Gizlilik
            </Link>
            {" · "}
            <Link href="/yasal/kullanim-sartlari" className="font-medium text-suk-brand hover:underline">
              Kullanım şartları
            </Link>
          </p>
        </section>
      </div>
    </section>
  );
}
