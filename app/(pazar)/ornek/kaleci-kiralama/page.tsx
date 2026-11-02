import type { Metadata } from "next";
import { ChevronRight, MessageCircle } from "lucide-react";

import { RatingBadge } from "@/components/marketplace/rating-badge";
import { StatusDot } from "@/components/marketplace/status-dot";
import { formatPriceTl, publicCustomerName } from "@/lib/marketplace/format";

export const metadata: Metadata = {
  title: "Kaleci kiralama örneği",
  robots: { index: false, follow: false },
};

const QUOTES = [
  {
    firstName: "Can",
    lastName: "Yılmaz",
    priceTl: 650,
    rating: 4.8,
    reviews: 52,
    tone: "bg-sky-100 text-sky-800",
    message: "Kadıköy’de oynuyorum, 21:00’den önce sahadayım. Eldivenim var.",
  },
  {
    firstName: "Mert",
    lastName: "Aksoy",
    priceTl: 750,
    rating: 4.9,
    reviews: 86,
    tone: "bg-emerald-100 text-emerald-800",
    message: "Halı saha maçlarına düzenli çıkıyorum. Forma bende, erken gelirim.",
  },
  {
    firstName: "Emre",
    lastName: "Şahin",
    priceTl: 900,
    rating: 5,
    reviews: 34,
    tone: "bg-amber-100 text-amber-800",
    message: "Kaleyi ben tutarım, maç sonuna kadar kalırım.",
  },
  {
    firstName: "Burak",
    lastName: "Demir",
    priceTl: 1100,
    rating: 4.7,
    reviews: 121,
    tone: "bg-violet-100 text-violet-800",
    message: "10 yıldır kaleciyim. Halı saha ve turnuva maçına çıkarım.",
  },
] as const;

const ANSWERS = [
  { prompt: "Ne için kaleci?", answer: "Halı saha maçı" },
  { prompt: "Ne kadar süre?", answer: "1 maç" },
];

export default function GoalkeeperAdSamplePage() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold">Kaleci kiralama: Halı saha maçı</h1>
        <p className="text-sm text-muted-foreground">Cumartesi, 21:00 · Caferağa Mah., Kadıköy, İstanbul</p>
        <p className="text-xs font-semibold text-muted-foreground">İlan kodu SK-4K7M2P</p>
        <div className="pt-1">
          <StatusDot tone="blue" label="Yeterli teklif geldi" />
        </div>
      </header>
      <section className="mk-card space-y-3 p-4 text-sm">
        {ANSWERS.map((answer) => (
          <p key={answer.prompt}>
            <span className="block text-muted-foreground">{answer.prompt}</span>
            <span className="font-semibold">{answer.answer}</span>
          </p>
        ))}
        <p>
          <span className="block text-muted-foreground">İhtiyacın detayları</span>
          <span className="whitespace-pre-wrap font-semibold">
            Cumartesi 21:00, Kadıköy’de 8 kişilik halı saha. Kaleci eksiğimiz var, maç boyunca kalede duracak biri lazım.
          </span>
        </p>
      </section>
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-extrabold">Teklifler</h2>
          <p className="text-sm text-muted-foreground">Bir teklife dokun, o kişiyle ayrı sohbet açılır.</p>
        </div>
        <ul className="space-y-3">
          {QUOTES.map((quote) => {
            const name = publicCustomerName(quote.firstName, quote.lastName, "");
            return (
              <li key={name}>
                <article className="mk-card flex items-center gap-3 p-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${quote.tone}`}
                    aria-hidden
                  >
                    {quote.firstName.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold">{name}</p>
                      <p className="shrink-0 text-lg font-extrabold text-suk-brand">{formatPriceTl(quote.priceTl)}</p>
                    </div>
                    <RatingBadge average={quote.rating} count={quote.reviews} />
                    <p className="text-xs font-semibold text-muted-foreground">Bekliyor</p>
                    <p className="mt-1 text-sm text-muted-foreground">{quote.message}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-bold text-suk-brand">
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                      Sohbeti aç
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                </article>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
