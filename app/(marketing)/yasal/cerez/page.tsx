/* eslint-disable react/no-unescaped-entities -- legal prose contains
   intentional Turkish punctuation ('..', "..") that the lint rule would
   otherwise force us to HTML-escape, making the source unreadable. */
import type { Metadata } from "next";
import { LegalPageShell } from "../_components/legal-page-shell";
import { LEGAL_COMPANY } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "Çerez Politikası | Sukull",
  description:
    "Sukull'da kullanılan çerez türleri, amaçları ve çerez tercihlerinizi nasıl yönetebileceğiniz.",
  alternates: { canonical: "/yasal/cerez" },
};

export default function CerezPage() {
  const { contactEmail } = LEGAL_COMPANY;

  return (
    <LegalPageShell
      documentId="cerez"
      title="Çerez Politikası"
      lede="Platformu ziyaret ettiğinizde tarayıcınızda saklanan küçük metin dosyalarını (çerezleri) nasıl kullandığımızı açıklar."
    >
      <h2>1. Çerez Nedir?</h2>
      <p>
        Çerezler, bir web sitesini ziyaret ettiğinizde cihazınıza
        yerleştirilen, sonraki ziyaretlerde hatırlanmak üzere tasarlanmış
        küçük metin dosyalarıdır. Çerezler kendiliğinden kişisel veri
        niteliği taşımaz; ancak bir hesapla eşleştirildiklerinde kişisel
        veri olarak kabul edilebilirler.
      </p>

      <h2>2. Kullandığımız Çerez Türleri</h2>

      <h3>2.1 Kesinlikle Gerekli Çerezler (Zorunlu)</h3>
      <p>
        Platformun çalışması için kaçınılmazdır; tercih edilebilir değildirler.
      </p>
      <ul>
        <li>
          <code>sb-access-token</code>, <code>sb-refresh-token</code> —
          Supabase Auth oturum çerezleri.
        </li>
        <li>
          <code>x-request-id</code> başlığı ile ilişkili oturum bağlantısı —
          hata ayıklama ve güvenlik için.
        </li>
      </ul>

      <h3>2.2 İşlevsel Çerezler</h3>
      <p>Kullanıcı tercihlerini hatırlar (örn. tema, dil seçimi).</p>

      <h3>2.3 Analitik Çerezler</h3>
      <p>
        Platformu nasıl kullandığınızı anlamamıza yardımcı olur; içeriği
        geliştirmek için toplu ve anonim olarak işlenir. Bu çerezleri
        reddederseniz platform çalışmaya devam eder.
      </p>

      <h3>2.4 Pazarlama Çerezleri</h3>
      <p>
        Üçüncü taraf pazarlama çerezleri <strong>varsayılan olarak
        yüklenmez</strong>; aktive edilmeleri için açık rızanız gereklidir.
      </p>

      <h2>3. Çerezleri Nasıl Yönetebilirsiniz?</h2>
      <ul>
        <li>
          Tarayıcı ayarlarından tüm çerezleri silebilir veya yalnızca belirli
          çerezlere izin verebilirsiniz. Bununla birlikte "kesinlikle
          gerekli" çerezleri engellemek platformda oturum açmanızı
          imkânsızlaştırır.
        </li>
        <li>
          <strong>Chrome:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler.
        </li>
        <li>
          <strong>Firefox:</strong> Tercihler → Gizlilik ve Güvenlik.
        </li>
        <li>
          <strong>Safari:</strong> Tercihler → Gizlilik → Çerezler.
        </li>
      </ul>

      <h2>4. Çerezlerle Toplanan Veriler</h2>
      <p>
        Çerezler aracılığıyla yalnızca hesap kimliğiniz, oturum durumunuz
        ve tercihleriniz saklanır. Kredi kartı bilgisi, şifre veya özel
        nitelikli kişisel veri çerezlerde <strong>tutulmaz</strong>.
      </p>

      <h2>5. Güncellemeler</h2>
      <p>
        Çerez politikamız, platformumuzda kullandığımız teknolojiler
        değiştiğinde güncellenir. Güncel sürüm her zaman bu sayfada
        yayımlanır.
      </p>

      <h2>6. İletişim</h2>
      <p>
        Çerezlerle ilgili sorularınız için{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a> adresine
        yazabilirsiniz.
      </p>
    </LegalPageShell>
  );
}
