/* eslint-disable react/no-unescaped-entities -- legal prose contains
   intentional Turkish punctuation ('..', "..") that the lint rule would
   otherwise force us to HTML-escape, making the source unreadable. */
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "../_components/legal-page-shell";
import { LEGAL_COMPANY } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "Cayma Hakkı ve İade Koşulları | Sukull",
  description:
    "14 günlük cayma hakkı, dijital ürünlerdeki istisnalar ve iade / iptal sürecinin nasıl işlediği.",
  alternates: { canonical: "/yasal/cayma-iade" },
};

export default function CaymaIadePage() {
  const { contactEmail, kepAddress } = LEGAL_COMPANY;

  return (
    <LegalPageShell
      documentId="caymaIade"
      title="Cayma Hakkı ve İade Koşulları"
      lede="Mesafeli Sözleşmeler Yönetmeliği kapsamındaki cayma hakkınız ve iade / iptal süreçleri."
    >
      <h2>1. 14 Günlük Cayma Hakkı</h2>
      <p>
        Tüketici, kural olarak mesafeli sözleşmelerde <strong>14 gün</strong>{" "}
        içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin
        cayma hakkına sahiptir.
      </p>

      <h2>2. Cayma Hakkının Kullanılamayacağı Hâller</h2>
      <p>
        Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi gereğince
        aşağıdaki hâllerde cayma hakkı kullanılamaz:
      </p>
      <ul>
        <li>
          Elektronik ortamda anında ifa edilen hizmetler (ör. ödeme sonrası
          hesaba anında tanımlanan kredi paketleri, oyun içi avantajlar,
          abonelik aktivasyonu).
        </li>
        <li>
          Tüketiciye anında teslim edilen gayri maddi mallar (ör. dijital
          ders içeriklerine anlık erişim).
        </li>
        <li>
          Hizmetin ifasına tüketicinin açık rızasıyla başlanan ve cayma hakkı
          süresi sona ermeden önce ifası tamamlanan sözleşmeler.
        </li>
      </ul>

      <h2>3. Cayma Hakkının Kullanılabildiği Hâller</h2>
      <p>
        Ders rezervasyonu gibi henüz ifa başlamamış hizmetlerde cayma hakkı
        kullanılabilir. Bu durumda Alıcı, cayma hakkı süresi içinde{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a> adresine
        e-posta göndererek veya{" "}
        <strong>{kepAddress}</strong> KEP adresi üzerinden yazılı
        bildirimde bulunabilir.
      </p>

      <h2>4. İade Süreci</h2>
      <ul>
        <li>
          Cayma bildiriminiz tarafımıza ulaştıktan sonra en geç{" "}
          <strong>14 gün</strong> içinde ödemenizi kullandığınız yönteme
          iade ederiz.
        </li>
        <li>
          İade, Iyzico üzerinden kartınıza yapılır; kartınıza yansıma
          süresi bankanıza bağlıdır ve genellikle 1-7 iş günü alır.
        </li>
        <li>
          Kullanılmış kısmi hizmetler (ör. tamamlanmış birebir ders)
          iadeye konu olmaz; yalnızca kullanılmayan kısım iade edilir.
        </li>
      </ul>

      <h2>5. Özel Durumlar</h2>
      <h3>5.1 Öğretmen Gelmedi (No-Show)</h3>
      <p>
        Öğretmenin derse katılmaması hâlinde ödediğiniz kredi tam olarak
        hesabınıza iade edilir; ayrıca telafi olarak bir sonraki
        rezervasyonunuzda geçerli olacak bir kupon tanımlanabilir.
      </p>
      <h3>5.2 Teknik Hata</h3>
      <p>
        Platform kaynaklı bir aksaklık sebebiyle hizmet alamadıysanız,
        ilgili işlemi kayıtlarımızda tespit ederek otomatik iadeyi
        başlatırız.
      </p>

      <h2>6. Aboneliğin İptali</h2>
      <p>
        Aktif aboneliğinizi hesap ayarlarından dilediğiniz zaman iptal
        edebilirsiniz. İptal anında o dönem için tahakkuk etmiş ödemeler
        iade edilmez; abonelik avantajları dönem sonuna kadar kullanılmaya
        devam eder.
      </p>

      <h2>7. İletişim</h2>
      <p>
        İade ve cayma talepleriniz için öncelikle{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a> adresiyle
        iletişime geçmeniz süreci hızlandırır. Detaylı yasal bilgi için{" "}
        <Link href="/yasal/mesafeli-satis">Mesafeli Satış Sözleşmesi</Link>{" "}
        belgesine bakabilirsiniz.
      </p>
    </LegalPageShell>
  );
}
