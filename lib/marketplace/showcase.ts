/**
 * Giriş yapmamış ziyaretçilere ana sayfada gösterilen örnek ilanlar ve yorumlar.
 * Veritabanında yoktur; hizmet veren listelerine ve teklif akışına hiç girmez.
 */

export type ShowcaseRequest = {
  name: string;
  title: string;
  details: string;
  /** Bugünden kaç gün sonra; null ise "İki ay içinde". */
  inDays: number | null;
  hour?: number;
};

export type ShowcaseReview = {
  name: string;
  place: string;
  service: string;
  rating: number;
  text: string;
};

export const SHOWCASE_REQUESTS: ShowcaseRequest[] = [
  {
    name: "Zeynep A.",
    title: "Ev temizliği",
    details: "3+1 daire, haftada bir düzenli temizlik istiyorum. Evde kedi var, alerjisi olmayan biri olursa sevinirim.",
    inDays: 3,
    hour: 10,
  },
  {
    name: "Mert Y.",
    title: "Matematik özel ders",
    details: "12. sınıfım, TYT-AYT matematik için haftada iki gün ders arıyorum. Özellikle türev ve integralde zorlanıyorum.",
    inDays: 2,
    hour: 18,
  },
  {
    name: "Selin K.",
    title: "Online psikolog",
    details: "Son aylarda iş stresi ve uyku problemi yaşıyorum. Akşam saatlerinde online görüşme yapabilecek biriyle çalışmak istiyorum.",
    inDays: 4,
    hour: 20,
  },
  {
    name: "Burak D.",
    title: "Evden eve nakliyat",
    details: "2+1 evden 3. kattan 5. kata taşınacağız, iki bina da asansörlü. Paketleme dahil fiyat almak istiyorum.",
    inDays: 12,
    hour: 9,
  },
  {
    name: "Ayşe T.",
    title: "Boya badana",
    details: "Salon ve iki yatak odası boyanacak, yaklaşık 85 m². Tavanlarda küçük çatlaklar var, onların da kapatılması lazım.",
    inDays: null,
  },
  {
    name: "Emre S.",
    title: "Web sitesi yazılım projesi",
    details: "Küçük bir kafe için menü ve rezervasyon sayfası olan basit bir web sitesi istiyoruz. Mobilde düzgün görünmesi önemli.",
    inDays: null,
  },
  {
    name: "Gizem Ö.",
    title: "Nişan fotoğraf çekimi",
    details: "Evde küçük bir nişan yapacağız, yaklaşık 40 kişi. 3 saatlik çekim ve düzenlenmiş fotoğraflar istiyoruz.",
    inDays: 9,
    hour: 16,
  },
  {
    name: "Hakan B.",
    title: "Çamaşır makinesi tamiri",
    details: "Makine su alıyor ama sıkma yapmıyor, hata kodu E21 veriyor. Yaklaşık 6 yaşında, garantisi bitti.",
    inDays: 1,
    hour: 14,
  },
];

export const SHOWCASE_REVIEWS: ShowcaseReview[] = [
  {
    name: "Elif K.",
    place: "Kadıköy, İstanbul",
    service: "Ev temizliği",
    rating: 5,
    text: "Bir günde üç teklif geldi, fiyatları yan yana görmek çok işime yaradı. Gelen hanım çok titizdi, artık iki haftada bir o geliyor.",
  },
  {
    name: "Okan T.",
    place: "Çankaya, Ankara",
    service: "Online psikolog",
    rating: 5,
    text: "Kime gideceğimi bilemiyordum. Teklif veren psikologların mesajlarını okuyunca kendimi rahat hissettiğim biriyle başladım, üç seanstır devam ediyoruz.",
  },
  {
    name: "Derya M.",
    place: "Bornova, İzmir",
    service: "Matematik özel ders",
    rating: 5,
    text: "Oğlum için ders aradık. Hocamız ilk derste eksiklerini çıkarıp plan yaptı, deneme netleri iki ayda belirgin şekilde arttı.",
  },
  {
    name: "Serkan A.",
    place: "Nilüfer, Bursa",
    service: "Evden eve nakliyat",
    rating: 4,
    text: "Ekip zamanında geldi, eşyalar sağlam taşındı. Bir dolabın montajı biraz uzun sürdü ama genel olarak çok memnun kaldım.",
  },
  {
    name: "Nur S.",
    place: "Ataşehir, İstanbul",
    service: "Boya badana",
    rating: 5,
    text: "Ustanın verdiği fiyat başkalarının yarısı kadardı, işçilik de temizdi. Boya sonrası ortalığı da toparlayıp gitti.",
  },
  {
    name: "Kaan E.",
    place: "Konak, İzmir",
    service: "Web sitesi",
    rating: 5,
    text: "Dükkânım için basit bir site istedim. Teklif veren yazılımcı ne istediğimi hızlı anladı, bir haftada site yayındaydı.",
  },
  {
    name: "İrem Y.",
    place: "Muratpaşa, Antalya",
    service: "Düğün fotoğrafçısı",
    rating: 5,
    text: "Fotoğrafçımızın portfolyosunu teklif mesajından inceledik. Fotoğraflar beklediğimizden de güzel çıktı, herkese tavsiye ediyorum.",
  },
  {
    name: "Murat Ç.",
    place: "Selçuklu, Konya",
    service: "Kombi tamiri",
    rating: 4,
    text: "Kombi kışın ortasında bozuldu, aynı akşam teklif geldi ve ertesi sabah usta geldi. Parça gerektiği için bir gün daha bekledik.",
  },
  {
    name: "Ceren D.",
    place: "Beşiktaş, İstanbul",
    service: "Doğum günü organizasyonu",
    rating: 5,
    text: "Kızımın 7. yaş günü için süsleme ve animatör ayarladık. Her şey konuştuğumuz gibiydi, çocuklar çok eğlendi.",
  },
  {
    name: "Tolga K.",
    place: "Yenimahalle, Ankara",
    service: "Havalimanı transferi",
    rating: 5,
    text: "Sabah 5 uçuşu için transfer lazımdı. Şoför 10 dakika erken kapıdaydı, araç temizdi, fiyat da taksiden uygundu.",
  },
  {
    name: "Hatice B.",
    place: "Tepebaşı, Eskişehir",
    service: "Evde fizyoterapi",
    rating: 5,
    text: "Annem diz ameliyatı sonrası evden çıkamıyordu. Fizyoterapistimiz haftada üç gün eve geldi, şimdi bastonsuz yürüyor.",
  },
  {
    name: "Berk U.",
    place: "Karşıyaka, İzmir",
    service: "Köpek eğitimi",
    rating: 4,
    text: "Golden'ımız tasmayı çok çekiyordu. Eğitmen dört derste temel komutları öğretti, bize de evde nasıl çalışacağımızı gösterdi.",
  },
];

export function showcaseWhen(request: ShowcaseRequest, now = new Date()): string {
  if (request.inDays === null) return "İki ay içinde";
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + request.inDays);
  // Türkiye sabit UTC+3.
  date.setUTCHours((request.hour ?? 10) - 3, 0, 0, 0);
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}
