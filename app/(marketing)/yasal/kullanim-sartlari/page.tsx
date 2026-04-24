/* eslint-disable react/no-unescaped-entities -- legal prose contains
   intentional Turkish punctuation ('..', "..") that the lint rule would
   otherwise force us to HTML-escape, making the source unreadable. */
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "../_components/legal-page-shell";
import { LEGAL_COMPANY } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "Kullanım Şartları | Sukull",
  description:
    "Sukull'u kullanırken uyulması gereken kurallar, kullanıcı yükümlülükleri ve uyuşmazlık hâlinde yetkili merciler.",
  alternates: { canonical: "/yasal/kullanim-sartlari" },
};

export default function KullanimSartlariPage() {
  const { legalName, brandName, address } = LEGAL_COMPANY;

  return (
    <LegalPageShell
      documentId="kullanimSartlari"
      title="Kullanım Şartları"
      lede={`${brandName} platformunu kullanarak aşağıdaki şartları okuduğunuzu ve kabul ettiğinizi beyan edersiniz.`}
    >
      <h2>1. Taraflar</h2>
      <p>
        Bu Kullanım Şartları; <strong>{legalName}</strong> (bu belgede
        "<strong>Sukull</strong>" olarak anılacaktır) ile platforma kayıt
        olan veya platformu ziyaret eden gerçek/tüzel kişiler (bu belgede
        "<strong>Kullanıcı</strong>" olarak anılacaktır) arasında
        imzalanmış kabul edilir.
      </p>

      <h2>2. Hizmetin Tanımı</h2>
      <p>
        Sukull; eğitim içeriği, beceri oyunları, öğretmen-öğrenci
        eşleştirme, özel ders rezervasyonu ve ilgili topluluk araçları
        sunan dijital bir eğitim platformudur. Hizmetler ücretsiz ve ücretli
        planlar hâlinde sunulabilir.
      </p>

      <h2>3. Hesap Açma ve Kullanıcı Yükümlülükleri</h2>
      <ul>
        <li>
          Kullanıcı, hesap oluşturma sırasında doğru ve güncel bilgi verecektir.
        </li>
        <li>Şifresinin güvenliğinden bizzat sorumludur.</li>
        <li>
          Platformu hukuka aykırı, başkalarının haklarını ihlâl edici, reklam
          veya spam içerikli biçimde kullanmayacaktır.
        </li>
        <li>
          Otomatik bot, kazıma (scraping) veya tersine mühendislik
          yöntemleriyle hizmete zarar vermeyecektir.
        </li>
        <li>
          Puan, liderlik tablosu veya benzeri sistemleri manipüle etmeyecektir;
          aksi hâlde hesap kısıtlanabilir veya silinebilir.
        </li>
      </ul>

      <h2>4. Fikri Mülkiyet</h2>
      <p>
        Platform üzerindeki tüm içerik (ders metinleri, görseller, oyun
        mekanikleri, marka ve logo) Sukull'a veya lisans verenlerine aittir.
        Kullanıcı yalnızca kişisel, ticari olmayan eğitim amaçlı kullanım
        hakkına sahiptir; içeriği çoğaltamaz, satamaz veya dağıtamaz.
      </p>
      <p>
        Kullanıcı tarafından platforma yüklenen içerikler (kod snippet'leri,
        profil açıklamaları vb.) üzerinde kullanıcı hak sahibidir; ancak
        platformun işleyişi için gereken sınırda Sukull'a bedelsiz kullanım
        lisansı verilmiş sayılır.
      </p>

      <h2>5. Ücretler ve Ödemeler</h2>
      <ul>
        <li>
          Ücretli ürün/hizmet satışları{" "}
          <Link href="/yasal/mesafeli-satis">Mesafeli Satış Sözleşmesi</Link>{" "}
          kapsamında yürütülür.
        </li>
        <li>
          Fiyatlar ve vergi tutarları sipariş onayı öncesinde açıkça
          gösterilir.
        </li>
        <li>
          Aboneliğin iptali ve iade koşulları için{" "}
          <Link href="/yasal/cayma-iade">Cayma Hakkı ve İade Koşulları</Link>{" "}
          sayfasına bakınız.
        </li>
      </ul>

      <h2>6. Hizmetin Askıya Alınması veya Sonlandırılması</h2>
      <p>
        Sukull; bu Kullanım Şartları'nın ihlâli veya platformun güvenliğinin
        tehdit edildiği durumlarda herhangi bir hesabı uyarı yaparak veya
        durumun aciliyetine göre uyarı yapmadan askıya alma veya kapatma
        hakkını saklı tutar.
      </p>

      <h2>7. Sorumluluğun Sınırı</h2>
      <p>
        Platform "olduğu gibi" sunulur. Yasaların izin verdiği azami ölçüde
        Sukull, dolaylı zararlar, kâr kaybı veya veri kaybına ilişkin
        taleplerden sorumlu tutulamaz. Bu sınır, kasıt veya ağır kusur
        hâllerinde uygulanmaz.
      </p>

      <h2>8. Üçüncü Taraf Bağlantılar</h2>
      <p>
        Platform, üçüncü taraflara ait içerik veya bağlantılar içerebilir.
        Bu tür üçüncü taraf hizmetlerin içerikleri veya gizlilik
        uygulamalarından Sukull sorumlu değildir.
      </p>

      <h2>9. Değişiklikler</h2>
      <p>
        Bu Kullanım Şartları güncellenebilir. Güncelleme hâlinde sayfanın
        başındaki "Yürürlük Tarihi" yenilenir. Değişikliklerin ardından
        platformu kullanmaya devam etmeniz güncel şartları kabul ettiğiniz
        anlamına gelir.
      </p>

      <h2>10. Uygulanacak Hukuk ve Yetkili Mahkeme</h2>
      <p>
        Taraflar arasındaki uyuşmazlıklara Türkiye Cumhuriyeti hukuku
        uygulanır. <strong>Tüketicinin Korunması Hakkında Kanun</strong>{" "}
        hükümleri saklı kalmak kaydıyla uyuşmazlıkların çözümünde{" "}
        <strong>İstanbul Merkez (Çağlayan) Mahkemeleri ve İcra
        Daireleri</strong> yetkilidir. Tüketici uyuşmazlıklarında, ilgili
        parasal sınırlar dâhilinde Tüketici Hakem Heyetleri ve Tüketici
        Mahkemeleri yetkilidir.
      </p>

      <h2>11. İletişim ve Tebligat</h2>
      <p>
        Resmî tebligat adresimiz <strong>{address}</strong>'tir. Elektronik
        tebligat için KEP adresimiz{" "}
        <Link href="/yasal/kvkk">KVKK Aydınlatma Metni</Link>'nde yer alır.
      </p>
    </LegalPageShell>
  );
}
