import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketplace/json-ld";
import { CATEGORIES, servicesInCategory } from "@/lib/marketplace/catalog";
import { MARKET_ORIGIN, faqJsonLd, servicePath } from "@/lib/marketplace/seo";

export const metadata: Metadata = {
  title: "Hizmetler",
  description: "Temizlik, tadilat, nakliyat, tamir ve daha fazlası. Ücretsiz ilan aç, teklifleri karşılaştır. Sukull komisyon almaz.",
  alternates: { canonical: "/hizmet" },
  openGraph: {
    title: "Hizmetler | Sukull",
    description: "Ücretsiz ilan aç, en fazla dört teklif karşılaştır. Komisyon yok.",
    url: `${MARKET_ORIGIN}/hizmet`,
  },
};

export default function ServicesHubPage() {
  return (
    <div className="space-y-8">
      <JsonLd data={faqJsonLd()} />
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Hizmetler</h1>
        <p className="max-w-xl text-base text-muted-foreground">
          İhtiyacını seç, ücretsiz ilan aç, teklifleri karşılaştır. Sukull ücret almaz.
        </p>
      </header>
      <div className="space-y-8">
        {CATEGORIES.map((category) => {
          const services = servicesInCategory(category.slug);
          return (
            <section key={category.slug} id={category.slug} className="scroll-mt-24">
              <h2 className="mb-3 text-lg font-extrabold">{category.name}</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {services.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={servicePath(service.slug)}
                      className="flex min-h-12 items-center rounded-2xl border-2 border-b-4 border-border bg-card px-4 py-3 font-semibold hover:bg-muted/40"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Hizmet mi veriyorsun?{" "}
        <Link href="/hizmet-ver" className="font-bold text-suk-brand">
          Nasıl iş aldığını gör
        </Link>
      </p>
    </div>
  );
}
