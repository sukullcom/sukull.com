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

      <h2>2. Hizmetin Tanımı ve Hizmet Modeli</h2>
      <p>
        Sukull iki ayrı hizmet sunar: (i) eğitim içeriği, beceri oyunları,
        sıralama ve topluluk araçları ile birlikte <strong>özel ders
        pazaryeri</strong> (talep ilanı, teklif, mesajlaşma kanalı) sunan dijital
        bir eğitim platformu ve (ii) sukull.com ana sayfasında sunulan,
        temizlik, tadilat, nakliyat, tamir, özel ders ve benzeri hizmetler için
        ücretsiz <strong>Hizmet Pazaryeri</strong>. Eğitim platformu ücretsiz ve
        ücretli planlar hâlinde sunulabilir. Hizmet Pazaryeri&apos;ne ilişkin özel
        kurallar <strong>3. maddede</strong> yer alır; bu maddede hüküm
        bulunmayan hâllerde bu belgenin diğer maddeleri uygulanır.
      </p>
      <p>
        <strong>Doğrudan platform hizmeti:</strong> Ders akışları, oyunlar,
        hesap yönetimi; ödeme altyapısı üzerinden satın alınan{" "}
        <strong>dijital hizmet paketleri</strong> (ör. özel ders pazarında mesaj
        ve teklif için kullanım hakları) ile{" "}
        <strong>yinelenen ücretli platform aboneliği</strong> tanımlanması ve
        benzeri özellikler Sukull tarafından işletilen yazılım kapsamında
        sunulur.
      </p>
      <p>
        <strong>Pazaryeri ve üçüncü taraflar:</strong> Talep ilanı oluşturma,
        ilanlara teklif verme ve eğitmen–öğrenci arasında mesajlaşma kanalının
        açılması, sektörde yaygın pazaryeri uygulamalarına benzer şekilde{" "}
        <strong>öğrenci ile onaylı eğitmen arasındaki iletişimi ve iş birliğini
        kolaylaştırmaya</strong> yöneliktir. Eğitmenin teklif vermesi veya
        mesajları yanıtlaması, dersin içeriği veya görüşmenin gerçekleşmesi
        gibi hususlar <strong>eğitmen ve öğrencinin kendi aralarındaki
        ilişkiye</strong> bağlıdır; Sukull bu tarafların bağımsız iradeleriyle
        hareket ettiğini, platformun ise kurallar, güvenlik ve teknik altyapı
        sağlayıcısı olduğunu belirtir. Taraflar arası uyuşmazlıklarda öncelikle
        birbirleriyle ve gerektiğinde destek kanallarımız ile iletişim
        kurulması esastır.
      </p>
      <p>
        <strong>Eğitim platformundaki özel ders talep ilanı (ilan) ve ödeme kategorisi:</strong> Öğrenciler
        tarafından açılan talep ilanları, özel ders ihtiyacının tanımlanması ve
        yalnızca platformda onaylı eğitmenlerin teklif verebilmesi amacıyla sunulan{" "}
        <strong>dijital aracılık hizmeti</strong> kapsamındadır. Bu süreçte tahsil
        edilen bedeller; mesajlaşma kanalı ve teklif süreçlerine ilişkin{" "}
        <strong>platform hizmet paketleri</strong> (sipariş ekranında adet ve bedel
        olarak gösterilir) üzerinden alınır. Öğretmen–öğrenci arasında kurulacak
        ders içeriği, ücreti ve usulü tarafların kendi aralarındaki anlaşmasına
        tabidir.
      </p>
      <p>
        <strong>Abonelik ve yinelenen ödemeler:</strong> Aylık veya dönemsel
        abonelikler, tanımlandığı süre boyunca hesabınıza bağlı dijital erişim
        veya avantajları ifade eder. Ücret, vergi, yenileme ve iptal koşulları
        sipariş / abonelik onayı öncesinde ekranda gösterilir; cayma ve iadeye
        ilişkin genel çerçeve için{" "}
        <Link href="/yasal/cayma-iade">Cayma Hakkı ve İade Koşulları</Link>{" "}
        belgesine bakınız.
      </p>

      <h2>3. Hizmet Pazaryeri</h2>
      <p>
        <strong>İşleyiş:</strong> Hizmet almak isteyen kullanıcı
        ("<strong>Hizmet Alan</strong>") ihtiyacını birkaç soruyu cevaplayarak bir
        talep ilanı hâlinde oluşturur. İlgili hizmeti verdiğini belirten
        kullanıcılar ("<strong>Hizmet Veren</strong>") ilana fiyat ve mesaj
        içeren teklif gönderir. Hizmet Alan teklifleri karşılaştırır, dilediğini
        kabul eder ve taraflar mesajlaşarak ayrıntıları kararlaştırır.
      </p>
      <p>
        <strong>Ücretsizdir:</strong> Sukull, Hizmet Pazaryeri için Hizmet
        Alan&apos;dan veya Hizmet Veren&apos;den üyelik, ilan, teklif veya komisyon
        bedeli almaz ve taraflar arasındaki ödemelere aracılık etmez. Hizmet
        bedeli, ödeme şekli ve zamanı taraflar arasında doğrudan kararlaştırılır.
      </p>
      <p>
        <strong>Sukull&apos;un rolü:</strong> Sukull yalnızca tarafların birbirini
        bulmasını ve iletişim kurmasını sağlayan teknik altyapıyı sunar; taraflar
        arasında kurulan hizmet ilişkisinin tarafı, temsilcisi veya garantörü
        değildir. Hizmet Veren&apos;lerin kimliği, mesleki yeterliliği, ruhsat veya
        belgeleri Sukull tarafından ayrıca doğrulanmaz. Hizmetin kalitesi,
        süresi, güvenliği, fiyatı, faturalandırılması ve vergisel yükümlülükleri
        ile mevzuatın gerektirdiği izin, belge ve sigortalar Hizmet Veren&apos;in
        sorumluluğundadır. Hizmet Alan, seçimini teklifleri, mesajları ve varsa
        değerlendirmeleri inceleyerek kendisi yapar.
      </p>
      <p>
        <strong>İlanların incelenmesi ve yayın süresi:</strong> Talep ilanları
        yayına alınmadan önce Sukull tarafından incelenebilir; bu kurallara veya
        mevzuata aykırı bulunan ilanlar reddedilebilir ya da yayından
        kaldırılabilir. İlanlar seçilen zamana göre belirli bir süre yayında
        kalır; süresi dolan veya Hizmet Alan tarafından kapatılan ilana yeni
        teklif verilemez. Bir ilana verilebilecek teklif sayısı ile kullanıcı
        başına günlük ilan, teklif ve mesaj sayısı kötüye kullanımı önlemek
        amacıyla sınırlandırılabilir.
      </p>
      <p>
        <strong>İletişim bilgisinin paylaşılması:</strong> Hizmet Alan, talep
        oluştururken tercih ettiği iletişim kanalını (telefon veya e-posta)
        seçer. Bu bilgi ilan listesinde gösterilmez; yalnızca o ilana teklif
        veren Hizmet Veren&apos;lere teklif sohbeti içinde gösterilir. Hizmet
        Veren, bu bilgiyi yalnızca ilgili talep hakkında Hizmet Alan ile
        iletişim kurmak için kullanabilir; reklam, pazarlama veya başka
        amaçlarla kullanamaz, saklayamaz ve üçüncü kişilerle paylaşamaz.
      </p>
      <p>
        <strong>Hizmet Pazaryeri&apos;nde yasak olan davranışlar:</strong>
      </p>
      <ul>
        <li>Gerçek bir ihtiyaca dayanmayan ilan veya gerçek bir hizmet sunma amacı taşımayan teklif oluşturmak,</li>
        <li>Mevzuata aykırı, ruhsat gerektirdiği hâlde ruhsatsız veya başkalarının haklarını ihlâl eden hizmet talep etmek ya da sunmak,</li>
        <li>Başka bir kişinin kimliğini, fotoğrafını veya iletişim bilgisini kullanmak,</li>
        <li>Dolandırıcılık amacıyla kapora, ön ödeme veya kişisel/finansal bilgi istemek,</li>
        <li>Taraflara hakaret, taciz, tehdit veya ayrımcılık içeren mesaj göndermek,</li>
        <li>İletişim bilgilerini toplu toplamak, spam veya reklam mesajı göndermek,</li>
        <li>Gerçek bir deneyime dayanmayan veya yanıltıcı değerlendirme yazmak.</li>
      </ul>
      <p>
        Bu kurallara aykırı davranan kullanıcıların ilanları, teklifleri,
        mesajları veya değerlendirmeleri kaldırılabilir ve hesapları 7. madde
        uyarınca kısıtlanabilir. Kullanıcılar, şüpheli bir durumla
        karşılaştıklarında <strong>{LEGAL_COMPANY.contactEmail}</strong> adresine
        bildirimde bulunabilir. Hizmet bedelinin tamamını hizmet alınmadan önce
        ödememenizi ve kimlik veya kart bilgilerinizi paylaşmamanızı öneririz.
      </p>

      <h2>4. Hesap Açma ve Kullanıcı Yükümlülükleri</h2>
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

      <h2>5. Fikri Mülkiyet</h2>
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

      <h2>6. Ücretler ve Ödemeler</h2>
      <ul>
        <li>
          Hizmet Pazaryeri ücretsizdir; Hizmet Alan ile Hizmet Veren arasındaki
          ödemeler Sukull üzerinden yapılmaz ve bu maddenin aşağıdaki
          hükümleri Hizmet Pazaryeri&apos;ne uygulanmaz.
        </li>
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
          Eğitim platformundaki özel ders pazaryeri (talep ilanı, teklif, mesajlaşma kanalı) ve ücretli platform
          aboneliğiyle ilgili bedellerin kapsamı, sipariş ekranında ve bu belgenin{" "}
          <strong>2. maddesinde</strong> özetlendiği hizmet modeli ile uyumlu
          olarak yorumlanır.
        </li>
        <li>
          Aboneliğin iptali ve iade koşulları için{" "}
          <Link href="/yasal/cayma-iade">Cayma Hakkı ve İade Koşulları</Link>{" "}
          sayfasına bakınız.
        </li>
      </ul>

      <h2>7. Hizmetin Askıya Alınması veya Sonlandırılması</h2>
      <p>
        Sukull; bu Kullanım Şartları'nın ihlâli veya platformun güvenliğinin
        tehdit edildiği durumlarda herhangi bir hesabı uyarı yaparak veya
        durumun aciliyetine göre uyarı yapmadan askıya alma veya kapatma
        hakkını saklı tutar.
      </p>

      <h2>8. Sorumluluğun Sınırı</h2>
      <p>
        Platform "olduğu gibi" sunulur. Yasaların izin verdiği azami ölçüde
        Sukull, dolaylı zararlar, kâr kaybı veya veri kaybına ilişkin
        taleplerden sorumlu tutulamaz. Bu sınır, kasıt veya ağır kusur
        hâllerinde uygulanmaz.
      </p>

      <h2>9. Üçüncü Taraf Bağlantılar</h2>
      <p>
        Platform, üçüncü taraflara ait içerik veya bağlantılar içerebilir.
        Bu tür üçüncü taraf hizmetlerin içerikleri veya gizlilik
        uygulamalarından Sukull sorumlu değildir.
      </p>

      <h2>10. Değişiklikler</h2>
      <p>
        Bu Kullanım Şartları güncellenebilir. Güncelleme hâlinde sayfanın
        başındaki "Yürürlük Tarihi" yenilenir. Değişikliklerin ardından
        platformu kullanmaya devam etmeniz güncel şartları kabul ettiğiniz
        anlamına gelir.
      </p>

      <h2>11. Uygulanacak Hukuk ve Yetkili Mahkeme</h2>
      <p>
        Taraflar arasındaki uyuşmazlıklara Türkiye Cumhuriyeti hukuku
        uygulanır. <strong>Tüketicinin Korunması Hakkında Kanun</strong>{" "}
        hükümleri saklı kalmak kaydıyla uyuşmazlıkların çözümünde{" "}
        <strong>İstanbul Merkez (Çağlayan) Mahkemeleri ve İcra
        Daireleri</strong> yetkilidir. Tüketici uyuşmazlıklarında, ilgili
        parasal sınırlar dâhilinde Tüketici Hakem Heyetleri ve Tüketici
        Mahkemeleri yetkilidir.
      </p>

      <h2>12. İletişim ve Tebligat</h2>
      <p>
        Resmî tebligat adresimiz <strong>{address}</strong>&apos;tir. Satıcıya ilişkin
        güncel iletişim ve (varsa) KEP bilgileri{" "}
        <Link href="/yasal/on-bilgilendirme">Ön Bilgilendirme Formu</Link> ve{" "}
        <Link href="/yasal/mesafeli-satis">Mesafeli Satış Sözleşmesi</Link>{" "}
        belgelerinde yer alır.
      </p>
    </LegalPageShell>
  );
}
