/* eslint-disable react/no-unescaped-entities -- legal prose contains
   intentional Turkish punctuation ('..', "..") that the lint rule would
   otherwise force us to HTML-escape, making the source unreadable. */
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "../_components/legal-page-shell";
import { LEGAL_COMPANY } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi | Sukull",
  description:
    "6502 sayılı Tüketicinin Korunması Hakkında Kanun çerçevesinde dijital ürün ve hizmet satışına ilişkin mesafeli satış sözleşmesi.",
  alternates: { canonical: "/yasal/mesafeli-satis" },
};

export default function MesafeliSatisPage() {
  const { legalName, mersisNumber, address, contactEmail, phone } = LEGAL_COMPANY;

  return (
    <LegalPageShell
      documentId="mesafeliSatis"
      title="Mesafeli Satış Sözleşmesi"
      lede="6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği çerçevesinde hazırlanmıştır."
    >
      <h2>1. Taraflar</h2>
      <p>
        <strong>SATICI:</strong>
      </p>
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
        {phone ? (
          <li>
            <strong>Telefon:</strong> {phone}
          </li>
        ) : null}
      </ul>
      <p>
        <strong>ALICI:</strong> Sipariş formunda veya üyelik kaydında
        belirtilen gerçek kişi (bundan sonra "Alıcı" olarak anılacaktır).
      </p>

      <h2>2. Sözleşmenin Konusu</h2>
      <p>
        İşbu sözleşmenin konusu, Alıcı'nın Sukull platformu üzerinden
        elektronik ortamda satın aldığı dijital ürün veya hizmetin (ders
        kredisi, abonelik, oyun içi avantajlar vb.) niteliği, satış bedeli,
        teslim/ifa süreleri ve tarafların hak ve yükümlülüklerinin
        düzenlenmesidir.
      </p>

      <h2>3. Ürün / Hizmet Bilgisi</h2>
      <p>
        Satın alınan ürün veya hizmetin adı, adedi, KDV dahil peşin satış
        fiyatı, ödeme bilgisi ve geçerli varsa abonelik süresi, sipariş
        tamamlama ekranında ve Alıcı'ya iletilen sipariş özet e-postasında
        ayrı ayrı belirtilmiştir. Bu bilgiler işbu sözleşmenin ayrılmaz
        parçasıdır.
      </p>

      <h2>4. Ödeme</h2>
      <p>
        Ödemeler, kredi kartı / banka kartı aracılığıyla <strong>Iyzico</strong>{" "}
        ödeme altyapısı üzerinden alınır. Kart bilgileri Sukull
        sunucularında <strong>saklanmaz</strong>. Fatura, e-Arşiv fatura
        olarak Alıcı'nın e-posta adresine iletilir.
      </p>

      <h2>5. Teslim / İfa</h2>
      <p>
        Satın alınan hizmetler dijital niteliktedir. Ödeme onaylandığı anda
        kredi/abonelik kullanıcı hesabına tanımlanır; kullanıcı derhâl
        hizmetten yararlanmaya başlayabilir. Aksaklık hâlinde en geç{" "}
        <strong>48 saat</strong> içinde destek ekibimize ulaşabilirsiniz.
      </p>

      <h2>6. Cayma Hakkı</h2>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği'nin 15/ğ maddesi uyarınca
        "elektronik ortamda anında ifa edilen hizmetler veya tüketiciye
        anında teslim edilen gayrimaddi mallara ilişkin sözleşmelerde"
        cayma hakkı kullanılamaz. Ancak henüz kullanılmamış / ifa
        başlamamış hizmetler için cayma hakkı ve özel iade koşulları için{" "}
        <Link href="/yasal/cayma-iade">Cayma Hakkı ve İade Koşulları</Link>{" "}
        sayfasını inceleyiniz.
      </p>

      <h2>7. Uyuşmazlık Çözümü</h2>
      <p>
        İşbu sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Tüketici
        uyuşmazlıklarında, Ticaret Bakanlığı'nca her yıl belirlenen parasal
        sınırlar dâhilinde <strong>Tüketici Hakem Heyetleri</strong> ve{" "}
        <strong>Tüketici Mahkemeleri</strong> yetkilidir.
      </p>

      <h2>8. Yürürlük</h2>
      <p>
        Alıcı, sipariş tamamlama ekranında sözleşmeyi okuduğunu ve kabul
        ettiğini işaretlediğinde sözleşme kurulmuş kabul edilir. Sözleşmeye
        ilişkin tüm iletişim ve tebligat, Alıcı'nın platforma kayıtlı
        e-posta adresi üzerinden yapılır.
      </p>
    </LegalPageShell>
  );
}
