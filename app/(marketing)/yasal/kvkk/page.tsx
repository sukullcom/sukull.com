/* eslint-disable react/no-unescaped-entities -- legal prose contains
   intentional Turkish punctuation ('..', "..") that the lint rule would
   otherwise force us to HTML-escape, making the source unreadable. */
import type { Metadata } from "next";
import { LegalPageShell } from "../_components/legal-page-shell";
import { LEGAL_COMPANY } from "@/lib/legal-info";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | Sukull",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu olarak Sukull'un aydınlatma metni.",
  alternates: { canonical: "/yasal/kvkk" },
};

export default function KvkkPage() {
  const {
    legalName,
    mersisNumber,
    address,
    kvkkEmail,
    kepAddress,
    websiteUrl,
  } = LEGAL_COMPANY;

  return (
    <LegalPageShell
      documentId="kvkk"
      title="KVKK Aydınlatma Metni"
      lede="6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi gereğince veri sorumlusu sıfatıyla hazırlanmıştır."
    >
      <h2>1. Veri Sorumlusu</h2>
      <p>
        Aşağıda yer alan açıklamalar, <strong>{legalName}</strong> (bundan
        sonra "<strong>Sukull</strong>" olarak anılacaktır) tarafından veri
        sorumlusu sıfatıyla hazırlanmıştır.
      </p>
      <ul>
        <li>
          <strong>Ticari Unvan:</strong> {legalName}
        </li>
        <li>
          <strong>MERSIS No:</strong> {mersisNumber}
        </li>
        <li>
          <strong>Tescilli Adres:</strong> {address}
        </li>
        <li>
          <strong>KEP Adresi:</strong> {kepAddress}
        </li>
        <li>
          <strong>KVKK İletişim:</strong>{" "}
          <a href={`mailto:${kvkkEmail}`}>{kvkkEmail}</a>
        </li>
        <li>
          <strong>Web Sitesi:</strong>{" "}
          <a href={websiteUrl} rel="noopener">
            {websiteUrl}
          </a>
        </li>
      </ul>

      <h2>2. İşlenen Kişisel Veri Kategorileri</h2>
      <ul>
        <li>
          <strong>Kimlik Bilgisi:</strong> Ad, soyad, kullanıcı adı.
        </li>
        <li>
          <strong>İletişim Bilgisi:</strong> E-posta adresi, (öğretmenler
          için) telefon numarası.
        </li>
        <li>
          <strong>Müşteri İşlem Bilgisi:</strong> Satın alma geçmişi, kredi
          kullanımı, abonelik durumu.
        </li>
        <li>
          <strong>Eğitim Bilgisi:</strong> Ders ilerlemesi, puan, istikrar
          (streak), ders/üniter tamamlama kayıtları.
        </li>
        <li>
          <strong>İşlem Güvenliği Bilgisi:</strong> IP adresi, tarayıcı
          parmak izi, oturum token'ı, cihaz ve oturum kimliği.
        </li>
        <li>
          <strong>Finansal Bilgi:</strong> Ödeme işleminin başarılı/başarısız
          durumu, fatura bilgileri. <em>Kredi kartı numarası tarafımızca
          saklanmaz</em>; ödeme altyapımız olan Iyzico üzerinden işlenir.
        </li>
        <li>
          <strong>Görsel İçerik:</strong> Profil fotoğrafı / avatar.
        </li>
      </ul>

      <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
      <p>
        Kişisel verileriniz KVKK'nın 5. ve 6. maddelerinde belirtilen
        hukuki sebeplere dayanarak aşağıdaki amaçlarla işlenir:
      </p>
      <ul>
        <li>Üyelik oluşturma ve hesap güvenliği sağlama,</li>
        <li>Eğitim içeriği sunma ve ilerlemenin takibi,</li>
        <li>
          Sözleşmenin kurulması ve ifası (ödeme, fatura, abonelik yenileme),
        </li>
        <li>Müşteri destek taleplerinin karşılanması,</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi,</li>
        <li>Hizmetin iyileştirilmesi, istatistiksel analiz,</li>
        <li>Kötüye kullanım ve dolandırıcılığın tespiti ve önlenmesi.</li>
      </ul>

      <h2>4. Kişisel Verilerin Aktarımı</h2>
      <p>
        Verileriniz, açık rızanıza ya da KVKK'nın 8. ve 9. maddelerinde
        belirtilen hukuki sebeplere dayalı olarak aşağıdaki alıcılara
        aktarılabilir:
      </p>
      <ul>
        <li>
          <strong>Yurt içinde:</strong> Yetkili kamu kurum ve kuruluşları,
          ödeme hizmeti sağlayıcıları (Iyzico), e-posta servis sağlayıcıları,
          müşteri destek altyapısı.
        </li>
        <li>
          <strong>Yurt dışında:</strong> Bulut altyapı hizmeti sağlayıcıları
          (Vercel, Supabase); KVKK'nın 9. maddesi kapsamında gerekli
          güvenlik tedbirleri alınmaktadır.
        </li>
      </ul>

      <h2>5. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebep</h2>
      <p>
        Kişisel verileriniz Sukull mobil ve web platformları, çerezler,
        sunucu günlükleri ve kullanıcı destek kanalları üzerinden elektronik
        ortamda toplanmaktadır. Hukuki sebepler şunlardır:
      </p>
      <ul>
        <li>Sözleşmenin kurulması veya ifası için gerekli olması,</li>
        <li>Hukuki yükümlülüğün yerine getirilmesi,</li>
        <li>Meşru menfaatimiz için gerekli olması (güvenlik, analitik),</li>
        <li>
          İlgili kişinin açık rızasının bulunması (örn. pazarlama izni).
        </li>
      </ul>

      <h2>6. İlgili Kişinin (Veri Sahibinin) Hakları</h2>
      <p>KVKK'nın 11. maddesi uyarınca:</p>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
        <li>
          İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,
        </li>
        <li>Yurt içi veya yurt dışında aktarılan üçüncü kişileri öğrenme,</li>
        <li>
          Eksik veya yanlış işlenmişse düzeltilmesini isteme,
        </li>
        <li>KVKK 7. maddesi çerçevesinde silinmesini veya yok edilmesini isteme,</li>
        <li>
          Düzeltme, silme ve yok etme işlemlerinin aktarıldığı üçüncü kişilere
          bildirilmesini isteme,
        </li>
        <li>
          Otomatik sistemlerce analiz edilmesi sonucu aleyhinize bir sonuç
          çıkmasına itiraz etme,
        </li>
        <li>Kanuna aykırı işleme sebebiyle zarara uğramışsanız tazminat isteme.</li>
      </ul>

      <h3>Başvuru Usulü</h3>
      <p>
        Yukarıdaki haklarınızı kullanmak için <a href={`mailto:${kvkkEmail}`}>{kvkkEmail}</a>{" "}
        adresine e-posta gönderebilir veya <strong>{kepAddress}</strong> KEP
        adresimize yazılı başvuruda bulunabilirsiniz. Başvurularınız KVKK'nın
        13. maddesi uyarınca en geç <strong>30 gün</strong> içinde
        sonuçlandırılır.
      </p>

      <h2>7. Güncellemeler</h2>
      <p>
        Bu aydınlatma metni, yasal değişiklikler veya hizmetlerimizdeki
        değişiklikler sebebiyle güncellenebilir. Güncel metin her zaman bu
        sayfada yayımlanır; yürürlük tarihi sayfanın başında belirtilmiştir.
      </p>
    </LegalPageShell>
  );
}
