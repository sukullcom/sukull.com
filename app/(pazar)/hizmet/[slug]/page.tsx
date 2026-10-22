import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketplace/json-ld";
import { Button } from "@/components/ui/button";
import { SERVICES, getService } from "@/lib/marketplace/catalog";
import {
  MARKET_FAQS,
  MARKET_ORIGIN,
  faqJsonLd,
  listedQuestions,
  relatedServices,
  serviceJsonLd,
  serviceMeta,
  servicePath,
  servicePlaceNote,
} from "@/lib/marketplace/seo";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const service = getService(params.slug);
  if (!service) return { title: "Hizmet" };
  const meta = serviceMeta(service);
  const url = `${MARKET_ORIGIN}${servicePath(service.slug)}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: servicePath(service.slug) },
    openGraph: {
      title: `${meta.title} | Sukull`,
      description: meta.description,
      url,
    },
  };
}

export default function ServiceLandingPage({ params }: { params: { slug: string } }) {
  const service = getService(params.slug);
  if (!service) notFound();
  const questions = listedQuestions(service);
  const related = relatedServices(service);
  const startHref = `/talep/yeni?hizmet=${encodeURIComponent(service.slug)}`;

  return (
    <article className="space-y-8">
      <JsonLd data={[serviceJsonLd(service), faqJsonLd()]} />
      <nav className="text-sm text-muted-foreground" aria-label="Konum">
        <Link href="/hizmet" className="hover:text-foreground hover:underline">
          Hizmetler
        </Link>
        <span aria-hidden> · </span>
        <Link href={`/hizmet#${service.categorySlug}`} className="hover:text-foreground hover:underline">
          {service.category}
        </Link>
      </nav>
      <header className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wide text-suk-brand">{service.category}</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{service.name} teklifi al</h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          İhtiyacını birkaç soruyla anlat, ilanın incelensin, uyan hizmet verenler fiyat ve mesaj göndersin. En fazla
          dört teklif gelir. Sukull komisyon almaz.
        </p>
        <Button asChild variant="primary" className="w-full sm:w-auto">
          <Link href={startHref}>Ücretsiz ilan aç</Link>
        </Button>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Nasıl çalışır?</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          <li className="mk-card p-4">
            <p className="font-bold">Anlat</p>
            <p className="mt-1 text-sm text-muted-foreground">Yeri, zamanı ve işin detayını yaz.</p>
          </li>
          <li className="mk-card p-4">
            <p className="font-bold">Teklif al</p>
            <p className="mt-1 text-sm text-muted-foreground">Onaylanınca hizmet verenler görür. Teklif gelince e-posta gider.</p>
          </li>
          <li className="mk-card p-4">
            <p className="font-bold">Seç</p>
            <p className="mt-1 text-sm text-muted-foreground">Sana uyan teklifi kabul et, sonra yazış.</p>
          </li>
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">İlanda ne sorulur?</h2>
        <ul className="space-y-2 text-sm">
          {questions.map((question) => (
            <li key={question.id} className="rounded-2xl border-2 border-border bg-card px-4 py-3">
              {question.prompt}
            </li>
          ))}
          <li className="rounded-2xl border-2 border-border bg-card px-4 py-3">Ne zaman lazım?</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">{servicePlaceNote(service)}</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Sık sorulanlar</h2>
        <dl className="space-y-3">
          {MARKET_FAQS.map((item) => (
            <div key={item.q} className="mk-card p-4">
              <dt className="font-bold">{item.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-extrabold">Aynı kategoride</h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={servicePath(item.slug)}
                  className="inline-flex min-h-11 items-center rounded-full border-2 border-border bg-card px-4 text-sm font-semibold"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild variant="primary" className="w-full sm:w-auto">
          <Link href={startHref}>Ücretsiz ilan aç</Link>
        </Button>
        <Link href="/hizmet-ver" className="text-center text-sm font-bold text-suk-brand">
          Bu işi veriyorsan, nasıl ilan görürsün
        </Link>
      </div>
    </article>
  );
}
