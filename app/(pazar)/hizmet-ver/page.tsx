import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketplace/json-ld";
import { Button } from "@/components/ui/button";
import { getServerUser } from "@/lib/auth";
import { MARKET_FAQS, MARKET_ORIGIN, faqJsonLd } from "@/lib/marketplace/seo";

export const metadata: Metadata = {
  title: "Hizmet ver",
  description:
    "Komisyonsuz iş al. Hizmetlerini ekle, uyan ilanlara teklif yaz. Yeni işler üç günde bir kısa e-posta ile gelir.",
  alternates: { canonical: "/hizmet-ver" },
  openGraph: {
    title: "Hizmet ver | Sukull",
    description: "Komisyon yok. Uyan ilanlara teklif yaz, kabul edilirse e-posta gelir.",
    url: `${MARKET_ORIGIN}/hizmet-ver`,
  },
};

const STEPS = [
  { title: "Hizmetlerini işaretle", text: "Temizlik, tadilat, ders, yazılım… Verdiğin işleri Hizmetlerim'e ekle." },
  { title: "Uyan ilanları gör", text: "Yerinde işler aynı şehirdekine gider. Online ve uzaktan işler her yerden görünür." },
  { title: "Teklif yaz", text: "Fiyat ve kısa bir not gönder. Müşteri kabul ederse e-posta gelir, yazışmaya devam edersin." },
];

export default async function BecomeProviderPage() {
  const user = await getServerUser();
  const startHref = user ? "/ayarlar/hizmetlerim" : "/login?next=/ayarlar/hizmetlerim";

  return (
    <div className="space-y-8">
      <JsonLd data={faqJsonLd()} />
      <header className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wide text-suk-brand">Hizmet verenler için</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Komisyonsuz iş al</h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          Sukull ilanları listeler, sen teklif yazarsın. Platform ücreti, komisyon veya teklif bedeli yok. Yeni uyan
          ilan olursa üç günde bir kısa bir e-posta gelir.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="primary" className="w-full sm:w-auto">
            <Link href={startHref}>{user ? "Hizmetlerimi düzenle" : "Hizmet vermeye başla"}</Link>
          </Button>
          {!user && (
            <Link href="/create-account" className="text-center text-sm font-bold text-suk-brand">
              Hesabın yoksa ücretsiz aç
            </Link>
          )}
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Nasıl iş alırsın?</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="mk-card p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-suk-brand text-sm font-bold text-suk-brand-fg">
                {index + 1}
              </span>
              <p className="mt-3 font-bold">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mk-card space-y-2 p-4">
        <h2 className="text-lg font-extrabold">Konum</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Profiline şehri ekle. Boya, temizlik, tamir gibi yerinde işler yalnızca bulunduğun ildeki ilanlarda görünür.
          Online ders, online psikolog veya yazılım gibi işlerde şehir gerekmez.
        </p>
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

      <p className="text-sm text-muted-foreground">
        Hizmet mi arıyorsun?{" "}
        <Link href="/hizmet" className="font-bold text-suk-brand">
          Tüm hizmetlere bak
        </Link>
      </p>
    </div>
  );
}
