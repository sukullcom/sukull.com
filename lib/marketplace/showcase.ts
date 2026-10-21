/**
 * Giriş yapmamış ziyaretçilere ana sayfada gösterilen örnek ilanlar ve yorumlar.
 * Veritabanında yoktur; hizmet veren listelerine ve teklif akışına hiç girmez.
 * Gerçek ilan ve yorum geldikçe bunların yerini onlar alır.
 */

import { formatWhen } from "@/lib/marketplace/format";

export type ShowcaseTiming = { inDays: number; hour: number } | "two_months" | "six_months" | "price_check";

export type ShowcaseRequest = {
  name: string;
  title: string;
  place: string;
  timing: ShowcaseTiming;
  answers: { prompt: string; answer: string }[];
  details: string;
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
    name: "Serkan T.",
    title: "Kombi tamiri",
    place: "Elmasbahçeler Mah., Osmangazi, Bursa",
    timing: { inDays: 2, hour: 9 },
    answers: [
      { prompt: "Kombiyle ilgili sorun nedir?", answer: "Hata kodu veriyor" },
      { prompt: "Kombinin markası?", answer: "Vaillant" },
    ],
    details: "Kombi ara ara kendini kapatıyor, ekranda F28 yazıyor. Reset atınca biraz çalışıp yine kapanıyor. Sabah evde olurum.",
  },
  {
    name: "Gülay K.",
    title: "Boya badana: İç cephe",
    place: "Cihangir Mah., Avcılar, İstanbul",
    timing: "price_check",
    answers: [
      { prompt: "Kaç oda boyanacak?", answer: "1" },
      { prompt: "Yaklaşık kaç metrekare?", answer: "20" },
      { prompt: "Fiyata malzeme dahil olsun mu?", answer: "Hariç - sadece işçilik" },
      { prompt: "Boyanacak alan eşyalı mı olacak?", answer: "Eşyalı olacak" },
      { prompt: "Tavanlar da boyanacak mı?", answer: "Evet" },
    ],
    details: "Yatak odası boyanacak, bir duvarda ince çatlaklar var macunlanması lazım. Boyayı kendim alacağım, renk açık gri.",
  },
  {
    name: "Kerem A.",
    title: "Python özel ders",
    place: "Online",
    timing: "two_months",
    answers: [
      { prompt: "Ders nerede / nasıl yapılsın?", answer: "Online" },
      { prompt: "Ne kadar süre özel ders almak istiyorsun?", answer: "3 ay" },
      { prompt: "Hangi sıklıkta?", answer: "Haftada 2" },
    ],
    details: "Sıfırdan Python öğrenip kendi yatırım analizlerimi yapabilmek istiyorum, ileride yapay zeka tarafına da geçmek istiyorum. Hafta içi akşamları müsaitim.",
  },
  {
    name: "Ahmet Ş.",
    title: "Evden eve nakliyat",
    place: "Bahçelievler Mah., Çankaya, Ankara",
    timing: { inDays: 12, hour: 8 },
    answers: [
      { prompt: "Kaç odalı ev eşyası taşınacak?", answer: "3+1" },
      { prompt: "Eşyalar kaçıncı katta?", answer: "3-5. kat" },
      { prompt: "Binada asansör var mı?", answer: "Var" },
      { prompt: "Paketleme de yapılsın mı?", answer: "Paketleme de yapılsın" },
    ],
    details: "Aynı ilçe içinde taşınıyoruz, yeni ev 2. katta. Büyük bir gardırop var sökülüp kurulması lazım, buzdolabı ve çamaşır makinesi de var.",
  },
  {
    name: "Merve D.",
    title: "Ev temizliği",
    place: "Kazımdirik Mah., Bornova, İzmir",
    timing: { inDays: 3, hour: 10 },
    answers: [
      { prompt: "Evin büyüklüğü nedir?", answer: "2+1" },
      { prompt: "Ne sıklıkla?", answer: "2 haftada 1" },
    ],
    details: "Çalıştığım için ev ihmal oluyor, 2 haftada bir düzenli gelecek birini arıyorum. Camlar da silinsin. Evde bir kedimiz var.",
  },
  {
    name: "Pınar Y.",
    title: "Kodlama eğitimi",
    place: "Caferağa Mah., Kadıköy, İstanbul",
    timing: "two_months",
    answers: [
      { prompt: "Ders nerede / nasıl yapılsın?", answer: "Kendi evinde" },
      { prompt: "Hangi sıklıkta?", answer: "Haftada 1" },
    ],
    details: "5 yaşındaki oğlum için legolarla kodlama dersi arıyoruz. Legoya çok meraklı, oyun gibi öğretecek sabırlı bir hoca olursa çok iyi olur.",
  },
  {
    name: "Selin K.",
    title: "Psikolog: Kaygı ve korku bozukluğu (anksiyete)",
    place: "Online",
    timing: { inDays: 4, hour: 20 },
    answers: [{ prompt: "Görüşme nasıl olsun?", answer: "Online" }],
    details: "Son birkaç aydır sürekli gerginim, gece uyumakta zorlanıyorum. İşten çıkınca akşam 8den sonra görüşebilirim.",
  },
  {
    name: "Hakan B.",
    title: "Çamaşır makinesi tamiri",
    place: "Atatürk Mah., Ümraniye, İstanbul",
    timing: { inDays: 1, hour: 14 },
    answers: [
      { prompt: "Markası?", answer: "Arçelik" },
      { prompt: "Cihazdaki sorun nedir?", answer: "Hata kodu veriyor" },
    ],
    details: "Su alıyor ama sıkmaya geçmiyor, ekranda E21 yazıyor. 6 yıllık makine garantisi bitti.",
  },
];

export const SHOWCASE_REVIEWS: ShowcaseReview[] = [
  {
    name: "Esra Ç.",
    place: "Ataşehir, İstanbul",
    service: "Ev temizliği",
    rating: 5,
    text: "Songül hanım gerçekten çok titiz, buzdolabının içine kadar sildi. Artık 2 haftada bir o geliyor teşekkürler",
  },
  {
    name: "Murat Ç.",
    place: "Osmangazi, Bursa",
    service: "Kombi tamiri",
    rating: 5,
    text: "Akşam ilan verdim sabah 9da kapıdaydı. Arızayı yarım saatte buldu, gereksiz parça değiştirmeye de kalkmadı. Mehmet ustaya teşekkür ederim",
  },
  {
    name: "Nur S.",
    place: "Avcılar, İstanbul",
    service: "Boya badana",
    rating: 5,
    text: "Temiz işçilik, eşyaları güzelce örtüp öyle başladı. Hasan usta herkese tavsiye ederim",
  },
  {
    name: "Serkan A.",
    place: "Çankaya, Ankara",
    service: "Evden eve nakliyat",
    rating: 5,
    text: "5. kattan taşındık hiç bir eşyamız çizilmedi. Erkan bey ve ekibi hem hızlı hem çok saygılıydı, gönül rahatlığıyla çalışabilirsiniz.",
  },
  {
    name: "Derya M.",
    place: "Bornova, İzmir",
    service: "Matematik özel ders",
    rating: 5,
    text: "Oğlum matematikten çok korkuyordu, Selin hoca ile 3 ayda netleri 12den 27ye çıktı. Sabrı için ayrıca teşekkürler",
  },
  {
    name: "Okan T.",
    place: "Online",
    service: "Psikolog",
    rating: 5,
    text: "İlk görüşmede çok çekiniyordum ama Dilek hanım beni çok rahatlattı. Online olması da benim için büyük kolaylık oldu.",
  },
  {
    name: "Hatice B.",
    place: "Ümraniye, İstanbul",
    service: "Beyaz eşya tamiri",
    rating: 4,
    text: "Usta işini biliyor makine şuan sorunsuz çalışıyor. Söylediği saatten 1 saat geç geldi o yüzden 4 yıldız",
  },
  {
    name: "Kaan E.",
    place: "Online",
    service: "Yazılım projesi",
    rating: 5,
    text: "Kafemiz için menü ve rezervasyon sitesini 1 haftada teslim etti, sonradan istediğim değişiklikleri de üşenmeden yaptı. Can beye teşekkürler",
  },
  {
    name: "İrem Y.",
    place: "Muratpaşa, Antalya",
    service: "Fotoğrafçı",
    rating: 5,
    text: "Nişan fotoğraflarımız çok güzel çıktı 3 gün içinde de elimizdeydi. Burcu hanım çok güler yüzlü kesinlikle tavsiye ederim",
  },
  {
    name: "Tolga K.",
    place: "Yenimahalle, Ankara",
    service: "Klima servisi",
    rating: 5,
    text: "Bakım ve gaz kontrolü yapıldı. Fiyatı uygun, işini hızlı ve temiz yaptı.",
  },
  {
    name: "Berk U.",
    place: "Karşıyaka, İzmir",
    service: "Köpek eğitimi",
    rating: 5,
    text: "Köpeğimiz tasmayı çok çekiyordu, Onur bey 4 derste düzeltti. Bize de evde nasıl çalışacağımızı tek tek gösterdi",
  },
  {
    name: "Ceren D.",
    place: "Beşiktaş, İstanbul",
    service: "Organizasyon",
    rating: 4,
    text: "Kızımın doğum günü süslemesi çok güzeldi çocuklar bayıldı. Balonlar biraz geç geldi ama Gamze hanım hemen halletti tşk ederiz",
  },
];

export function showcaseWhen(request: ShowcaseRequest, now = new Date()): string {
  if (typeof request.timing === "string") return formatWhen(request.timing, null);
  // Türkiye sabit UTC+3; gün, İstanbul takvimine göre sayılır.
  const date = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  date.setUTCDate(date.getUTCDate() + request.timing.inDays);
  date.setUTCHours(request.timing.hour - 3, 0, 0, 0);
  return formatWhen("scheduled", date);
}
