/* eslint-disable react/no-unescaped-entities -- legal prose contains
   intentional Turkish punctuation ('..', "..") that the lint rule would
   otherwise force us to HTML-escape, making the source unreadable. */
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "../_components/legal-page-shell";
import { LEGAL_COMPANY } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "Ön Bilgilendirme Formu | Sukull",
  description:
    "Mesafeli sözleşme öncesi Tüketicinin Korunması Hakkında Kanun uyarınca sunulan ön bilgilendirme formu.",
  alternates: { canonical: "/yasal/on-bilgilendirme" },
};

export default function OnBilgilendirmePage() {
  const { legalName, address, contactEmail, mersisNumber } = LEGAL_COMPANY;

  return (
    <LegalPageShell
      documentId="onBilgilendirme"
      title="Ön Bilgilendirme Formu"
      lede="Satın alma işlemini tamamlamadan önce Mesafeli Sözleşmeler Yönetmeliği'nin 5. maddesi gereğince bilgilerinize sunulan formdur."
    >
      <h2>1. Satıcı Bilgileri</h2>
      <ul>
        <li>
          <strong>Unvan:</strong> {legalName}
        </li>
        <li>
          <strong>MERSIS:</strong> {mersisNumber}
        </li>
        <li>
          <strong>Adres:</strong> {address}
        </li>
        <li>
          <strong>E-posta:</strong>{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </li>
      </ul>

      <h2>2. Ürün / Hizmet Temel Nitelikleri</h2>
      <p>
        Sepet ve ödeme ekranında ürün/hizmetin adı, kapsamı, ücretli abonelik
        süresi, kredi tutarı ve KDV dahil toplam bedeli açıkça belirtilir.
        Bu bilgiler sözleşmenin ayrılmaz parçasıdır.
      </p>

      <h2>3. Toplam Bedel ve Ödeme</h2>
      <p>
        Tüm fiyatlar Türk Lirası (TRY) cinsinden KDV dahil olarak gösterilir.
        Kargo ücreti ve benzeri ek maliyet uygulanmaz; dijital ifa
        gerçekleştirilir. Ödeme Iyzico üzerinden kredi kartı veya banka
        kartıyla alınır.
      </p>

      <h2>4. Ödeme ve Teslim Süresi</h2>
      <p>
        Dijital ürünlerde ödeme onaylandığı anda ifa başlar; krediler veya
        abonelik hakkı hesabınıza aynı anda yansır.
      </p>

      <h2>5. Cayma Hakkı</h2>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca
        <em> "elektronik ortamda anında ifa edilen hizmetler veya tüketiciye
        anında teslim edilen gayri maddi mallara ilişkin sözleşmelerde"</em>{" "}
        cayma hakkı kullanılamaz. Cayma hakkı uygulanabilir hâllerde sürece
        ilişkin ayrıntılar için{" "}
        <Link href="/yasal/cayma-iade">Cayma Hakkı ve İade Koşulları</Link>{" "}
        sayfasına bakınız.
      </p>

      <h2>6. Şikâyet ve İtiraz Mercii</h2>
      <p>
        Tüketici sıfatını haiz Alıcı, şikâyet ve itirazlarını, ilgili
        parasal sınırlar dâhilinde ikamet ettiği yerdeki veya ürün/hizmetin
        satın alındığı yerdeki Tüketici Hakem Heyetleri ile Tüketici
        Mahkemeleri'ne iletebilir.
      </p>

      <h2>7. Onay</h2>
      <p>
        Alıcı, sipariş tamamlama ekranında bu ön bilgilendirme formunu
        okuduğunu, anladığını ve Mesafeli Satış Sözleşmesi hükümlerini kabul
        ettiğini elektronik olarak onaylar.
      </p>
    </LegalPageShell>
  );
}
