import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Lock, CreditCard, ArrowRight, Mail } from "lucide-react";

import { LEGAL_COMPANY } from "@/lib/legal-info";
import { PaymentTrustStrip } from "@/components/payment-trust-strip";

export const metadata: Metadata = {
  title: "Hakkımızda | Sukull",
  description:
    "Sukull dijital eğitim platformu: misyon, güvenli ödeme ve iletişim. Ticari ve yasal bilgiler için resmî belgelere yönlendirme.",
  alternates: { canonical: "/hakkimizda" },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  const c = LEGAL_COMPANY;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Hakkımızda</h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          <strong className="text-foreground">{c.brandName}</strong>, öğrencilerin matematik ve fen
          yolculuğunu destekleyen dijital bir öğrenme ortamıdır. Yapılandırılmış ders içerikleri,
          beyin oyunları, sıralama ve özel ders pazaryeri gibi modüllerle; web üzerinden erişilebilen,
          hesap temelli ve güvenli bir platform sunarız.
        </p>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          Ödeme işlemleri, kart verileriniz bizde depolanmadan{" "}
          <abbr title="Ödeme hizmeti sağlayıcı">Iyzico</abbr> altyapısı üzerinden yürütülür. Kişisel
          verileriniz ve tüketici haklarınız, yayınladığımız yasal metinlerle şeffaf biçimde
          açıklanır.
        </p>
      </header>

      <div className="space-y-10">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <BookOpen className="h-5 w-5 text-suk-brand" aria-hidden />
            Ne sunuyoruz?
          </h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground marker:text-suk-brand">
            <li>Okul müfredatına uyumlu ders ve alıştırma akışları</li>
            <li>Oyunlaştırılmış beceri geliştirme ve sıralama</li>
            <li>Onaylı eğitmenlerle özel ders ve mesajlaşma pazaryeri</li>
            <li>Özel ders pazarı için ücretli platform hizmet paketleri ve abonelik seçenekleri</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-suk-brand/25 bg-gradient-to-br from-card to-suk-brand-soft/30 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">İletişim ve resmî bilgiler</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Pazarlama amaçlı bir <strong className="text-foreground">Hakkımızda</strong> sayfasında
            tüm vergi sicili detaylarını göstermek zorunlu değildir; o bilgilerin tam ve güncel
            listesi <strong className="text-foreground">mesafeli satış öncesi formları</strong> ve{" "}
            <strong className="text-foreground">sözleşmelerde</strong> yer alır. Aşağıdaki bağlantı
            üzerinden satıcı bilgilerinize (unvan, adres, MERSİS, vergi, KEP vb.) ulaşılır.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={`mailto:${c.contactEmail}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-suk-brand hover:underline"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {c.contactEmail}
            </a>
            <Link
              href="/yasal/on-bilgilendirme"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-suk-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-suk-brand-hover"
            >
              Satıcı ve yasal bilgiler
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            KVKK başvuruları:{" "}
            <a className="font-medium text-suk-brand hover:underline" href={`mailto:${c.kvkkEmail}`}>
              {c.kvkkEmail}
            </a>{" "}
            · Tüm belgeler:{" "}
            <Link href="/yasal" className="font-medium text-suk-brand hover:underline">
              Yasal bilgiler
            </Link>
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Lock className="h-5 w-5 text-suk-payment" aria-hidden />
            Güvenli bağlantı (SSL / HTTPS)
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {c.brandName} üretim ortamında <strong className="text-foreground">HTTPS</strong> ile
            sunulur. Tarayıcı ile sunucu arasındaki trafik şifrelidir. Kart bilgileriniz Sukull
            sunucularında saklanmaz; ödeme ekranında girdiğiniz kart verileri doğrudan ödeme
            kuruluşu tarafından işlenir.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <CreditCard className="h-5 w-5 text-suk-payment" aria-hidden />
            Kabul edilen ödemeler
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Visa ve Mastercard logotipleri ile birlikte, güvenli ödeme için{" "}
            <strong className="text-foreground">iyzico ile Öde</strong> işaretini ödeme adımlarında
            ve sitede gösteriyoruz.
          </p>
          <div className="mt-6 flex justify-center rounded-xl border border-border/80 bg-muted/30 py-5">
            <PaymentTrustStrip />
          </div>
        </section>
      </div>
    </section>
  );
}
