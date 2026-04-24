/* eslint-disable react/no-unescaped-entities -- legal prose contains
   intentional Turkish punctuation ('..', "..") that the lint rule would
   otherwise force us to HTML-escape, making the source unreadable. */
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "../_components/legal-page-shell";
import { LEGAL_COMPANY } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Sukull",
  description:
    "Sukull'da kişisel verilerinizin nasıl işlendiği, saklandığı ve korunduğu hakkında bilgi.",
  alternates: { canonical: "/yasal/gizlilik" },
};

export default function GizlilikPage() {
  const { brandName, contactEmail } = LEGAL_COMPANY;

  return (
    <LegalPageShell
      documentId="gizlilik"
      title="Gizlilik Politikası"
      lede={`Bu politika, ${brandName} platformunu kullanırken toplanan kişisel verilere nasıl davrandığımızı kullanıcıların anlayabileceği bir dilde açıklar.`}
    >
      <h2>1. Kapsam</h2>
      <p>
        Bu politika <strong>sukull.com</strong> web sitesi, ilgili mobil
        uygulamalar ve entegre alt hizmetler için geçerlidir. Resmî yasal
        yükümlülüklerimiz{" "}
        <Link href="/yasal/kvkk">KVKK Aydınlatma Metni</Link> dokümanında
        ayrıntılı olarak düzenlenmiştir.
      </p>

      <h2>2. Toplanan Veri Türleri</h2>
      <ul>
        <li>
          <strong>Hesap bilgileri:</strong> e-posta, kullanıcı adı, profil
          fotoğrafı (isteğe bağlı).
        </li>
        <li>
          <strong>Öğrenme verileri:</strong> ders ilerlemesi, puan, istikrar,
          günlük hedef, kazanımlar.
        </li>
        <li>
          <strong>Cihaz ve kullanım verileri:</strong> IP adresi, tarayıcı
          türü, oturum süresi, ziyaret edilen sayfalar.
        </li>
        <li>
          <strong>Ödeme verileri:</strong> yalnızca işlemin sonucu (başarılı
          / başarısız), son 4 hane ve kart markası. <em>Kart numarası,
          CVV ve son kullanma tarihi sunucularımıza hiçbir zaman ulaşmaz.
          </em>
        </li>
        <li>
          <strong>Hata kayıtları:</strong> Platformun kararlılığı için
          sunucu hatalarını ve yığın izlerini kaydederiz. Bu kayıtlardan
          kullanıcı kimliği, hesap silinmesi talebi üzerine kaldırılır.
        </li>
      </ul>

      <h2>3. Verilerinizin Kullanım Amaçları</h2>
      <ul>
        <li>Hizmeti sunmak ve hesabınızı güvende tutmak,</li>
        <li>Ders ilerlemenizi ve liderlik tablolarını hesaplamak,</li>
        <li>Ödemelerinizi işlemek ve fatura üretmek,</li>
        <li>Yasal yükümlülüklere uymak,</li>
        <li>
          Hizmeti iyileştirmek için toplu (anonim) istatistiksel analizler
          yapmak.
        </li>
      </ul>

      <h2>4. Veri Paylaşımı</h2>
      <p>
        Verilerinizi <strong>satmayız</strong>. Aşağıdaki durumlar dışında
        kimseyle paylaşmayız:
      </p>
      <ul>
        <li>
          Hizmeti çalıştırmak için gerekli altyapı sağlayıcıları (ör. Supabase,
          Vercel, Iyzico).
        </li>
        <li>
          Yasal bir yükümlülüğümüz olduğunda yetkili kamu kurumları.
        </li>
        <li>Açık rızanızı verdiğiniz üçüncü taraflar.</li>
      </ul>

      <h2>5. Saklama Süreleri</h2>
      <ul>
        <li>
          <strong>Hesap verileri:</strong> Hesabınız silindiği anda kalıcı
          olarak temizlenir.
        </li>
        <li>
          <strong>Ödeme kayıtları:</strong> Yasal saklama süresi gereği en
          az 10 yıl. Anonimleştirilmiş finansal loglar daha uzun süre
          tutulabilir.
        </li>
        <li>
          <strong>Hata kayıtları:</strong> 90 güne kadar, ardından
          otomatik olarak silinir.
        </li>
        <li>
          <strong>Aktivite logları:</strong> Detaylı kayıtlar 30 gün,
          toplu istatistikler (kullanıcı bazlı olmayan) kalıcı.
        </li>
      </ul>

      <h2>6. Çocukların Gizliliği</h2>
      <p>
        Sukull, eğitim odaklı bir platformdur ve 13 yaş altı çocukların
        hesap oluşturabilmesi için velinin izni gereklidir. 13 yaş altı bir
        kullanıcıya ilişkin bilgi aldığımızda hesap veli onayı olmaksızın
        devre dışı bırakılır.
      </p>

      <h2>7. Güvenlik</h2>
      <ul>
        <li>Tüm trafik HTTPS ile şifrelenir.</li>
        <li>
          Şifreler sunucularımıza düz metin olarak ulaşmaz; Supabase Auth
          tarafından Argon2 ile hash'lenir.
        </li>
        <li>
          Uygulama katmanında güvenlik başlıkları (CSP, HSTS, Permissions-Policy)
          zorunlu kılınır.
        </li>
        <li>
          Hassas yönetici işlemleri ayrı bir denetim tablosunda izlenir
          (audit log).
        </li>
      </ul>

      <h2>8. Haklarınız ve İletişim</h2>
      <p>
        Verilerinizle ilgili sorularınız için{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a> adresine yazabilir,
        resmi başvurularınızı{" "}
        <Link href="/yasal/kvkk">KVKK Aydınlatma Metni</Link> bölümündeki
        kanallar üzerinden iletebilirsiniz. Hesabınızı dilediğiniz zaman
        profil ayarlarından kalıcı olarak silebilirsiniz.
      </p>
    </LegalPageShell>
  );
}
