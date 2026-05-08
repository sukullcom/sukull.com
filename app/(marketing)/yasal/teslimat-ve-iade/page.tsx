/* eslint-disable react/no-unescaped-entities -- legal prose */
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "../_components/legal-page-shell";
import { LEGAL_COMPANY } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "Teslimat ve İade Şartları | Sukull",
  description:
    "Dijital ürün ve hizmetlerin teslim şekli, süreleri ve iade / cayma süreçleri (özet).",
  alternates: { canonical: "/yasal/teslimat-ve-iade" },
};

export default function TeslimatVeIadePage() {
  const { brandName, contactEmail } = LEGAL_COMPANY;

  return (
    <LegalPageShell
      documentId="teslimatVeIade"
      title="Teslimat ve İade Şartları"
      lede={`${brandName} üzerinden sunulan dijital ürün ve hizmetlerin teslimi ile iade süreçlerinin özeti.`}
    >
      <h2>1. Teslimat</h2>
      <p>
        Platformda satın alınan <strong>dijital içerik ve pazaryeri hizmet paketleri</strong>, ödeme onayından sonra
        ilgili kullanıcı hesabına elektronik ortamda tanımlanır. Fiziksel ürün gönderimi
        bulunmamaktadır. Özel ders ilanı ve mesajlaşma gibi hizmetler, sözleşmede tanımlanan
        dijital kanallar üzerinden ifa edilir.
      </p>

      <h2>2. Teslim süresi</h2>
      <p>
        Ödeme altyapısından başarılı onay alındığında, satın alınan dijital kullanım hakları genellikle
        <strong> anında veya kısa süre içinde</strong> hesaba yansır. Banka / kart sağlayıcı
        gecikmeleri veya teknik kesintiler hâlinde süre uzayabilir; bu durumda{" "}
        <a className="text-suk-brand underline hover:text-suk-brand-hover" href={`mailto:${contactEmail}`}>
          {contactEmail}
        </a>{" "}
        üzerinden destek talep edebilirsiniz.
      </p>

      <h2>3. İade ve cayma</h2>
      <p>
        6502 sayılı Tüketicinin Korunması Hakkında Kanun ve ilgili yönetmelikler çerçevesindeki{" "}
        <strong>cayma hakkı, istisnalar ve iade prosedürü</strong> ayrıntılı olarak şu belgede
        açıklanmıştır:
      </p>
      <ul>
        <li>
          <Link href="/yasal/cayma-iade" className="text-suk-brand underline hover:text-suk-brand-hover">
            Cayma Hakkı ve İade Koşulları
          </Link>
        </li>
        <li>
          <Link href="/yasal/mesafeli-satis" className="text-suk-brand underline hover:text-suk-brand-hover">
            Mesafeli Satış Sözleşmesi
          </Link>
        </li>
      </ul>

      <h2>4. İletişim</h2>
      <p>
        Teslimat veya iade ile ilgili talepleriniz için{" "}
        <a className="text-suk-brand underline hover:text-suk-brand-hover" href={`mailto:${contactEmail}`}>
          {contactEmail}
        </a>{" "}
        adresine yazabilirsiniz.
      </p>
    </LegalPageShell>
  );
}
