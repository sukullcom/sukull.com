export type ServiceOption = { value: string; label: string };

export type ServiceQuestion = {
  id: string;
  prompt: string;
  kind: "single" | "multi" | "text";
  options?: ServiceOption[];
  optional?: boolean;
  when?: (answers: Record<string, string>) => boolean;
  /** Alt soru: sadece üst soru bu cevabı aldığında sorulur (ör. ders = Enstrüman). */
  parent?: { questionId: string; value: string };
  /**
   * Hizmet verenin "Hizmetlerim"de ayrı ayrı seçebildiği alanlar bu sorunun seçenekleridir;
   * ilanlar hizmet verene bu cevaba göre gösterilir.
   */
  variant?: VariantSpec;
};

export type VariantSpec = {
  allLabel: string;
  pickLabel: string;
  /** Hizmetlerim'deki etiketi tamamlar: "Buzdolabı" + "tamiri". */
  suffix?: string;
};

export type ServiceDef = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  aliases: string[];
  popular?: boolean;
  questions: ServiceQuestion[];
};

export const CATEGORIES: { slug: string; name: string }[] = [
  { slug: "temizlik", name: "Temizlik" },
  { slug: "tadilat", name: "Tadilat" },
  { slug: "nakliyat", name: "Nakliyat" },
  { slug: "tamir", name: "Tamir" },
  { slug: "ozel-ders", name: "Özel Ders" },
  { slug: "yazilim", name: "Yazılım" },
  { slug: "ulasim", name: "Ulaşım" },
  { slug: "organizasyon", name: "Organizasyon" },
  { slug: "saglik", name: "Sağlık" },
  { slug: "evcil-hayvan", name: "Evcil Hayvan" },
  { slug: "fotograf", name: "Fotoğraf" },
];

const HOME_SIZES: ServiceOption[] = [
  "1+1",
  "2+1",
  "3+1",
  "4+1",
  "5+1",
  "Daha büyük",
].map((label) => ({ value: label, label }));

const AREA_SIZES: ServiceOption[] = [
  "20",
  "50",
  "80",
  "100",
  "120",
  "150",
  "180",
  "200",
  "300",
  "500",
  "1000",
  "2000",
  "5000",
  "10000 veya daha fazla",
].map((label) => ({ value: label, label: label.includes("veya") ? label : `${label} m²` }));

const ROOM_COUNTS: ServiceOption[] = ["1", "2", "3", "4", "5", "6+"].map((label) => ({
  value: label,
  label: label === "6+" ? "6 veya daha fazla" : label,
}));

const MATERIAL: ServiceOption[] = [
  { value: "Dahil olsun", label: "Dahil olsun" },
  { value: "Dahil olmasın", label: "Dahil olmasın" },
  { value: "Fark etmez", label: "Fark etmez" },
];

const SCHOOL_SUBJECTS: ServiceOption[] = [
  "Matematik",
  "Türkçe",
  "Fen bilimleri",
  "Sosyal bilgiler",
  "İngilizce",
  "Tarih",
  "Coğrafya",
  "Edebiyat",
  "Geometri",
  "Fizik",
  "Kimya",
  "Biyoloji",
].map((label) => ({ value: label, label }));

export const LESSON_FOLLOW_UPS = [
  {
    id: "dil",
    parent: "Yabancı dil",
    prompt: "Hangi dil?",
    options: [
      "İngilizce",
      "Almanca",
      "Fransızca",
      "İspanyolca",
      "İtalyanca",
      "Rusça",
      "Arapça",
      "Japonca",
      "Çince",
      "Korece",
      "Yabancılar için Türkçe",
      "Diğer",
    ],
  },
  {
    id: "enstruman",
    parent: "Enstrüman",
    prompt: "Hangi enstrüman?",
    options: ["Gitar", "Elektro gitar", "Piyano", "Keman", "Bağlama", "Bateri", "Ud", "Flüt", "Klarnet", "Çello", "Diğer"],
  },
  {
    id: "muzik",
    parent: "Müzik",
    prompt: "Ne çalışmak istiyorsun?",
    options: ["Şan (vokal)", "Solfej", "Müzik teorisi", "Diğer"],
  },
  {
    id: "spor",
    parent: "Spor",
    prompt: "Hangi spor?",
    options: ["Tenis", "Basketbol", "Futbol", "Voleybol", "Boks", "Kick boks", "Bisiklet", "Diğer"],
  },
  {
    id: "dans",
    parent: "Dans",
    prompt: "Hangi dans?",
    options: ["Salsa", "Bachata", "Tango", "Vals", "Bale", "Halk dansları", "Hip hop", "Modern dans", "Diğer"],
  },
] as const;

function followUp(parentQuestion: string, item: (typeof LESSON_FOLLOW_UPS)[number]): ServiceQuestion {
  return {
    id: item.id,
    kind: "single",
    prompt: item.prompt,
    parent: { questionId: parentQuestion, value: item.parent },
    when: (answers) => answers[parentQuestion] === item.parent,
    options: item.options.map((label) => ({ value: label, label })),
  };
}

function isSchoolLevel(answers: Record<string, string>) {
  return ["İlkokul", "Ortaokul", "Lise", "Üniversite"].includes(answers.ders ?? "");
}

function choice(id: string, prompt: string, labels: string[]): ServiceQuestion {
  return {
    id,
    kind: "single",
    prompt,
    options: labels.map((label) => ({ value: label, label })),
  };
}

/** Hizmet vereni ayıran soru. `multi` ise talep eden birden fazla seçebilir. */
function area(
  id: string,
  prompt: string,
  labels: string[],
  variant: VariantSpec,
  kind: "single" | "multi" = "single",
): ServiceQuestion {
  return { ...choice(id, prompt, labels), kind, variant };
}

export const SERVICES: ServiceDef[] = [
  {
    slug: "ev-temizligi",
    name: "Ev temizliği",
    category: "Temizlik",
    categorySlug: "temizlik",
    popular: true,
    aliases: ["temizlik", "ev", "apartman", "gunluk", "gunlukci"],
    questions: [
      { id: "buyukluk", kind: "single", prompt: "Evin büyüklüğü nedir?", options: HOME_SIZES },
      choice("siklik", "Ne sıklıkla?", ["Tek sefer", "Haftada 1", "2 haftada 1", "Ayda 1"]),
    ],
  },
  {
    slug: "bos-ev-temizligi",
    name: "Boş ev temizliği",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["temizlik", "bos ev", "tasinma", "boya sonrasi"],
    questions: [
      { id: "buyukluk", kind: "single", prompt: "Evin büyüklüğü nedir?", options: HOME_SIZES },
      {
        id: "esya",
        kind: "single",
        prompt: "Ev eşyalı mı?",
        options: [
          { value: "Boş", label: "Boş" },
          { value: "Eşyalı", label: "Eşyalı" },
        ],
      },
    ],
  },
  {
    slug: "boya-badana",
    name: "Boya badana",
    category: "Tadilat",
    categorySlug: "tadilat",
    popular: true,
    aliases: ["boya", "badana", "boyaci", "duvar"],
    questions: [
      area("tur", "Ne boyanacak?", ["İç cephe (oda veya ev)", "Dış cephe", "Dekoratif boya", "Kapı ve pencere", "Ahşap boya ve vernik"], { allLabel: "Tüm boya işleri", pickLabel: "Boya işlerini seç" }, "multi"),
      { id: "oda", kind: "single", prompt: "Kaç oda boyanacak?", options: ROOM_COUNTS, when: (answers) => (answers.tur ?? "").includes("İç cephe") },
      { id: "metrekare", kind: "single", prompt: "Yaklaşık kaç metrekare?", options: AREA_SIZES },
      { id: "malzeme", kind: "single", prompt: "Fiyata malzeme dahil olsun mu?", options: MATERIAL },
    ],
  },
  {
    slug: "fayans",
    name: "Fayans döşeme",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["fayans", "seramik", "banyo", "doseme"],
    questions: [
      choice("yer", "Nereye döşenecek?", ["Banyo", "Mutfak", "Salon veya oda zemini", "Balkon veya teras", "Dış cephe"]),
      { id: "metrekare", kind: "single", prompt: "Yaklaşık kaç metrekare?", options: AREA_SIZES },
      { id: "malzeme", kind: "single", prompt: "Fiyata malzeme dahil olsun mu?", options: MATERIAL },
    ],
  },
  {
    slug: "nakliyat",
    name: "Nakliyat",
    category: "Nakliyat",
    categorySlug: "nakliyat",
    popular: true,
    aliases: ["nakliye", "tasima", "evden eve", "hamal", "esya", "yuk"],
    questions: [
      {
        id: "tur",
        kind: "single",
        prompt: "Hangisine ihtiyacın var?",
        variant: { allLabel: "Tüm taşıma işleri", pickLabel: "Taşıma türlerini seç" },
        options: [
          "Evden eve nakliyat hizmeti",
          "Parça eşya taşıma",
          "Hamal",
          "Ofis taşıma",
          "Araç taşıma",
          "Motosiklet taşıma",
          "Yük taşıma",
          "Paletli yük taşıma",
        ].map((label) => ({ value: label, label })),
      },
      {
        id: "oda",
        kind: "single",
        prompt: "Kaç odalı ev eşyası taşınacak?",
        when: (answers) => answers.tur === "Evden eve nakliyat hizmeti",
        options: [
          "1+1",
          "2+1",
          "3+1",
          "4+1",
          "5+1",
          "Daha büyük",
          "Sadece birkaç eşya taşınacak",
        ].map((label) => ({ value: label, label })),
      },
    ],
  },
  {
    slug: "kombi-tamiri",
    name: "Kombi tamiri",
    category: "Tamir",
    categorySlug: "tamir",
    popular: true,
    aliases: ["kombi", "petek", "isitma", "dogalgaz"],
    questions: [
      choice("sorun", "Kombiyle ilgili sorun nedir?", ["Isıtmıyor", "Sıcak su vermiyor", "Su akıtıyor", "Ateşleme yapmıyor", "Hata kodu veriyor", "Yıllık bakım", "Diğer"]),
      choice("marka", "Kombinin markası?", ["Vaillant", "Bosch", "Demirdöküm", "ECA", "Baymak", "Buderus", "Ariston", "Viessmann", "Airfel", "Protherm", "Diğer", "Bilmiyorum"]),
    ],
  },
  {
    slug: "klima",
    name: "Klima servisi",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["klima", "sogutma", "montaj"],
    questions: [
      choice("islem", "Ne yapılmasını istiyorsun?", ["Montaj", "Söküp takma", "Bakım ve temizlik", "Gaz dolumu", "Arıza"]),
      choice("adet", "Kaç klima?", ["1", "2", "3", "4+"]),
    ],
  },
  {
    slug: "ozel-ders",
    name: "Özel ders",
    category: "Özel Ders",
    categorySlug: "ozel-ders",
    popular: true,
    aliases: [
      "ders",
      "ozel ders",
      "matematik",
      "ingilizce",
      "kurs",
      "hoca",
      "yapay zeka",
      "bilgisayar",
      "kodlama",
      "universite",
    ],
    questions: [
      {
        id: "ders",
        kind: "single",
        prompt: "Ne dersi almak istiyorsun?",
        options: [
          "Matematik",
          "Yabancı dil",
          "Türkçe",
          "Fen bilimleri",
          "LGS",
          "TYT",
          "AYT",
          "KPSS",
          "ALES",
          "DGS",
          "YDS / YÖKDİL",
          "IELTS / TOEFL",
          "Dans",
          "Kuran",
          "Yüzme",
          "Satranç",
          "Resim",
          "Spor",
          "Diksiyon",
          "Hızlı okuma",
          "Okuma yazma",
          "Öğrenci koçluğu",
          "Muhasebe",
          "Özel eğitim",
          "Yazılım",
          "Yapay zeka eğitimi",
          "Bilgisayar eğitimi",
          "Kodlama eğitimi",
          "Müzik",
          "Enstrüman",
          "İlkokul",
          "Ortaokul",
          "Lise",
          "Üniversite",
        ].map((label) => ({ value: label, label })),
      },
      {
        id: "okul-dersi",
        kind: "single",
        prompt: "Hangi ders?",
        when: isSchoolLevel,
        options: SCHOOL_SUBJECTS,
      },
      ...LESSON_FOLLOW_UPS.map((item) => followUp("ders", item)),
      {
        id: "nasil",
        kind: "single",
        prompt: "Ders nerede / nasıl yapılsın?",
        options: [
          { value: "Online", label: "Online (Zoom / webcam / WhatsApp vb.)" },
          { value: "Kendi evinde", label: "Kendi evinde" },
          { value: "Öğretmenin önerdiği yerde", label: "Öğretmenin önerdiği yerde" },
        ],
      },
      {
        id: "sure",
        kind: "single",
        prompt: "Ne kadar süre özel ders almak istiyorsun?",
        options: ["1 ay", "3 ay", "6 ay", "1 yıl", "Emin değilim"].map((label) => ({
          value: label,
          label,
        })),
      },
      {
        id: "siklik",
        kind: "single",
        prompt: "Hangi sıklıkta?",
        options: ["Haftada 1", "Haftada 2", "Haftada 3 veya daha fazla", "Esnek"].map((label) => ({
          value: label,
          label,
        })),
      },
    ],
  },
  {
    slug: "yazilim-projesi",
    name: "Yazılım projesi",
    category: "Yazılım",
    categorySlug: "yazilim",
    popular: true,
    aliases: ["yazilim", "software", "web", "uygulama", "android", "ios", "site", "oyun", "veri", "analiz", "yapay zeka", "eticaret", "otomasyon"],
    questions: [
      area(
        "tur",
        "Ne tür bir yazılım istiyorsun?",
        [
          "Web sitesi",
          "Mobil uygulama",
          "Oyun geliştirme",
          "Veri analizi",
          "Yapay zeka",
          "E-ticaret",
          "İş otomasyonu",
          "Masaüstü program",
          "Diğer",
        ],
        { allLabel: "Tüm yazılım işleri", pickLabel: "İş türlerini seç" },
        "multi",
      ),
      {
        id: "platform",
        kind: "multi",
        prompt: "Hangi platformlarda çalışsın?",
        options: [
          "Web sitesi",
          "Android",
          "iOS (iPhone / iPad)",
          "Windows",
          "Çok platformlu uygulama",
          "Diğer platformlar",
        ].map((label) => ({ value: label, label })),
      },
      {
        id: "butce",
        kind: "single",
        prompt: "Bütçe yaklaşık kaç TL?",
        options: [
          "5.000 TL",
          "10.000 TL",
          "25.000 TL",
          "50.000 TL",
          "100.000 TL",
          "250.000 TL",
          "500.000 TL veya daha fazla",
          "Bilmiyorum",
        ].map((label) => ({ value: label, label })),
      },
      {
        id: "sure",
        kind: "single",
        prompt: "Proje tahmini ne kadar sürer?",
        options: ["1-2 gün", "1-2 hafta", "3-6 hafta", "2-4 ay", "5+ ay"].map((label) => ({
          value: label,
          label,
        })),
      },
      {
        id: "uzmanlik",
        kind: "single",
        prompt: "Özellikle aradığın uzmanlık alanı var mı?",
        options: [
          "Tercihim yok",
          "Python",
          "C#",
          "Java",
          "C",
          "C++",
          "JavaScript",
          "PHP",
          "Diğer",
        ].map((label) => ({ value: label, label })),
      },
    ],
  },
  {
    slug: "arac-kiralama",
    name: "Araç kiralama",
    category: "Ulaşım",
    categorySlug: "ulasim",
    popular: true,
    aliases: ["araba", "arac", "kiralama", "rent", "oto"],
    questions: [
      {
        id: "kisi",
        kind: "single",
        prompt: "Araç kaç kişi için kiralanacak?",
        options: ["1", "2", "3", "4", "5", "6", "7+"].map((label) => ({ value: label, label })),
      },
      {
        id: "sure",
        kind: "single",
        prompt: "Kaç saat ya da gün kiralanacak?",
        options: ["1 saat", "2-4 saat", "1 gün", "2-3 gün", "1 hafta", "1 ay", "Daha uzun"].map(
          (label) => ({ value: label, label }),
        ),
      },
      {
        id: "not",
        kind: "text",
        optional: true,
        prompt: "Sürücü başka neyi bilmeli / neye dikkat etmeli?",
      },
    ],
  },
  {
    slug: "direksiyon-dersi",
    name: "Direksiyon dersi",
    category: "Ulaşım",
    categorySlug: "ulasim",
    popular: true,
    aliases: ["araba", "ehliyet", "direksiyon", "surucu", "sofor"],
    questions: [
      area("sinif", "Hangi ehliyet?", ["B (otomobil)", "A (motosiklet)", "C, D, E (ağır vasıta)"], { allLabel: "Tüm ehliyet sınıfları", pickLabel: "Ehliyet sınıflarını seç", suffix: "direksiyon dersi" }),
      choice("vites", "Hangi vites?", ["Manuel", "Otomatik", "Fark etmez"]),
      choice("deneyim", "Sürüş deneyimin nasıl?", ["Hiç yok", "Biraz var", "Sınava hazırlanıyorum", "Ehliyetim var, pratik istiyorum"]),
    ],
  },
  {
    slug: "arac-kaplama",
    name: "Araç kaplama",
    category: "Ulaşım",
    categorySlug: "ulasim",
    aliases: ["araba", "kaplama", "folyo", "ppf", "seramik"],
    questions: [
      area("tur", "Ne tür kaplama?", ["PPF", "Folyo", "Seramik kaplama", "Cam filmi", "Emin değilim"], { allLabel: "Tüm kaplamalar", pickLabel: "Kaplama türlerini seç", suffix: "kaplama" }),
      choice("parca", "Neresi kaplanacak?", ["Tüm araç", "Kaput", "Kapılar", "Tampon", "Camlar"]),
    ],
  },
  {
    slug: "organizasyon",
    name: "Organizasyon",
    category: "Organizasyon",
    categorySlug: "organizasyon",
    aliases: ["dugun", "parti", "etkinlik", "nisan", "dogum gunu"],
    questions: [
      area("tur", "Ne organize edilecek?", ["Doğum günü", "Nişan", "Düğün", "Kına gecesi", "Sünnet", "Baby shower", "Mezuniyet", "Kurumsal etkinlik", "Diğer"], { allLabel: "Tüm organizasyonlar", pickLabel: "Organizasyon türlerini seç", suffix: "organizasyonu" }),
      choice("kisi", "Yaklaşık kaç kişi?", ["1-20", "21-50", "51-100", "100'den fazla"]),
    ],
  },
  {
    slug: "ofis-temizligi",
    name: "Ofis temizliği",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["ofis", "isyeri", "temizlik"],
    questions: [choice("buyukluk", "Ofisin büyüklüğü nedir?", ["1-50 m²", "51-100 m²", "101-200 m²", "200 m² üzeri"])],
  },
  {
    slug: "koltuk-yikama",
    name: "Koltuk yıkama",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["koltuk", "cek yat", "yikama", "leke"],
    questions: [choice("adet", "Kaç koltuk yıkanacak?", ["1", "2", "3", "4 veya daha fazla"])],
  },
  {
    slug: "hali-yikama",
    name: "Halı yıkama",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["hali", "yikama", "kilim"],
    questions: [
      choice("adet", "Kaç halı yıkanacak?", ["1", "2", "3", "4 veya daha fazla"]),
      choice("yer", "Nerede yıkansın?", ["Fabrikada (alıp getirsin)", "Evde (yerinde)"]),
    ],
  },
  {
    slug: "bocek-ilaclama",
    name: "Böcek ilaçlama",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["bocek", "ilaclama", "hamam bocegi", "karinca", "fare"],
    questions: [
      area("tur", "Ne için ilaçlama?", ["Hamam böceği", "Karınca", "Tahta kurusu", "Pire", "Kene", "Sivrisinek ve sinek", "Akrep", "Fare", "Genel ilaçlama", "Diğer"], { allLabel: "Tüm ilaçlama işleri", pickLabel: "İlaçlama türlerini seç", suffix: "ilaçlama" }, "multi"),
      choice("yer", "Nereye?", ["Ev", "İşyeri", "Bahçe", "Apartman ortak alanı"]),
    ],
  },
  {
    slug: "su-tesisati",
    name: "Su tesisatı",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["tesisat", "musluk", "kacak", "su", "boru"],
    questions: [
      choice("sorun", "Sorun nedir?", ["Su kaçağı", "Musluk veya batarya", "Klozet ve rezervuar", "Termosifon veya şofben", "Hidrofor", "Komple tesisat yenileme", "Diğer"]),
    ],
  },
  {
    slug: "tikaniklik-acma",
    name: "Tıkanıklık açma",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["tikaniklik", "gider", "lavabo", "tuvalet", "robot"],
    questions: [choice("yer", "Neresi tıkalı?", ["Lavabo", "Tuvalet", "Duş gideri", "Mutfak", "Bina gideri"])],
  },
  {
    slug: "elektrikci",
    name: "Elektrikçi",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["elektrik", "priz", "sigorta", "avize", "kacak akim"],
    questions: [
      choice("islem", "Ne yapılacak?", ["Arıza", "Priz veya anahtar", "Avize ve aydınlatma", "Sigorta ve pano", "Komple tesisat yenileme", "Keşif"]),
    ],
  },
  {
    slug: "cilingir",
    name: "Çilingir",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["kilit", "kapi", "anahtar", "kilitli kaldi"],
    questions: [
      area("islem", "Ne gerekiyor?", ["Ev kapısı açma", "Kilit değişimi", "Çelik kapı kilidi", "Kasa açma", "Oto (araç) çilingir", "Anahtar kopyalama"], { allLabel: "Tüm çilingir işleri", pickLabel: "Çilingir işlerini seç" }),
    ],
  },
  {
    slug: "beyaz-esya",
    name: "Beyaz eşya tamiri",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["buzdolabi", "camasir", "bulasik", "firin", "beyaz esya"],
    questions: [
      area("cihaz", "Hangi cihaz?", ["Buzdolabı", "Çamaşır makinesi", "Bulaşık makinesi", "Kurutma makinesi", "Fırın", "Ocak", "Mikrodalga", "Derin dondurucu", "Diğer"], { allLabel: "Tüm cihazlar", pickLabel: "Cihazları seç", suffix: "tamiri" }),
      choice("marka", "Markası?", ["Arçelik", "Beko", "Bosch", "Siemens", "Vestel", "Samsung", "LG", "Profilo", "Diğer"]),
    ],
  },
  {
    slug: "petek-temizleme",
    name: "Petek temizleme",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["petek", "kombi", "kalorifer", "temizlik"],
    questions: [choice("adet", "Kaç petek temizlenecek?", ["1-3", "4-7", "8-12", "12 üzeri"])],
  },
  {
    slug: "mobilya-montaj",
    name: "Mobilya montajı",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["mobilya", "ikea", "montaj", "dolap", "kurulum"],
    questions: [choice("adet", "Kaç parça kurulacak?", ["1", "2-3", "4-6", "7 veya daha fazla"])],
  },
  {
    slug: "dusakabin",
    name: "Duşakabin",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["dus", "kabin", "banyo"],
    questions: [choice("islem", "Ne yapılacak?", ["Yeni montaj", "Cam değişimi", "Tamir"])],
  },
  {
    slug: "mutfak-dolabi",
    name: "Mutfak dolabı",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["mutfak", "dolap", "marangoz"],
    questions: [choice("islem", "Ne yapılacak?", ["Yeni dolap", "Kapak değişimi", "Tamir"])],
  },
  {
    slug: "sineklik",
    name: "Sineklik",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["pencere", "sineklik", "pilise"],
    questions: [choice("adet", "Kaç sineklik?", ["1", "2", "3", "4 veya daha fazla"])],
  },
  {
    slug: "parke",
    name: "Parke döşeme",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["parke", "laminat", "zemin", "doseme"],
    questions: [
      area("tur", "Ne yapılacak?", ["Laminat parke döşeme", "Masif parke döşeme", "Lamine parke döşeme", "Parke silme ve cila", "Parke tamiri"], { allLabel: "Tüm parke işleri", pickLabel: "Parke işlerini seç" }),
      { id: "metrekare", kind: "single", prompt: "Yaklaşık kaç metrekare?", options: AREA_SIZES },
      { id: "malzeme", kind: "single", prompt: "Fiyata malzeme dahil olsun mu?", options: MATERIAL },
    ],
  },
  {
    slug: "alcipan",
    name: "Alçıpan ve asma tavan",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["alcipan", "asma tavan", "kartonpiyer", "bolme duvar", "alci"],
    questions: [
      area("islem", "Ne yapılacak?", ["Asma tavan", "Bölme duvar", "Kartonpiyer", "Spot ve ışık bandı", "Tamir"], { allLabel: "Tüm alçıpan işleri", pickLabel: "Alçıpan işlerini seç" }),
    ],
  },
  {
    slug: "cam-balkon",
    name: "Cam balkon",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["cam balkon", "balkon", "pvc", "dograma"],
    questions: [choice("islem", "Ne yapılacak?", ["Yeni montaj", "Cam değişimi", "Tamir"])],
  },
  {
    slug: "bilgisayar-tamiri",
    name: "Bilgisayar tamiri",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["bilgisayar", "laptop", "notebook", "format", "yazici"],
    questions: [
      area("cihaz", "Hangi cihaz?", ["Dizüstü bilgisayar", "Masaüstü bilgisayar", "Mac (Apple)", "Tablet", "Yazıcı", "Oyun konsolu"], { allLabel: "Tüm cihazlar", pickLabel: "Cihazları seç", suffix: "tamiri" }),
      choice("sorun", "Sorun nedir?", ["Açılmıyor", "Yavaş çalışıyor / format", "Ekran", "Virüs", "Veri kurtarma", "Diğer"]),
    ],
  },
  {
    slug: "telefon-tamiri",
    name: "Telefon tamiri",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["telefon", "ekran", "batarya", "iphone", "samsung"],
    questions: [
      area("marka", "Telefonun markası?", ["iPhone", "Samsung", "Xiaomi", "Huawei", "Oppo", "Diğer"], { allLabel: "Tüm markalar", pickLabel: "Markaları seç", suffix: "tamiri" }),
      choice("islem", "Ne yapılacak?", ["Ekran değişimi", "Batarya değişimi", "Şarj soketi", "Kamera", "Suya düştü", "Diğer"]),
    ],
  },
  {
    slug: "guvenlik-kamerasi",
    name: "Güvenlik kamerası",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["kamera", "guvenlik", "alarm", "cctv"],
    questions: [
      area("sistem", "Hangi sistem?", ["Güvenlik kamerası", "Alarm sistemi", "Görüntülü diafon", "Akıllı kilit"], { allLabel: "Tüm güvenlik sistemleri", pickLabel: "Sistemleri seç" }),
      choice("islem", "Ne yapılacak?", ["Yeni kurulum", "Ekleme", "Arıza"]),
    ],
  },
  {
    slug: "diyetisyen",
    name: "Diyetisyen",
    category: "Sağlık",
    categorySlug: "saglik",
    aliases: ["diyet", "beslenme", "kilo", "zayiflama"],
    questions: [
      { id: "nasil", kind: "single", prompt: "Görüşme nasıl olsun?", options: [{ value: "Online", label: "Online (Zoom, WhatsApp vb.)" }, { value: "Diyetisyenin ofisinde", label: "Diyetisyenin ofisinde" }] },
      area("amac", "Hangi konuda destek istiyorsun?", ["Kilo verme", "Kilo alma", "Sağlıklı beslenme", "Sporcu beslenmesi", "Hamilelik ve emzirme", "Çocuk beslenmesi", "Diyabet ve insülin direnci", "Tiroit ve hormonal sorunlar", "Bağırsak sorunları", "Diğer"], { allLabel: "Tüm konular", pickLabel: "Konuları seç" }, "multi"),
    ],
  },
  {
    slug: "kisisel-antrenor",
    name: "Kişisel antrenör",
    category: "Sağlık",
    categorySlug: "saglik",
    aliases: ["antrenor", "pt", "fitness", "pilates", "yoga", "spor"],
    questions: [
      area("tur", "Ne çalışmak istiyorsun?", ["Fitness", "Kas geliştirme", "Kilo verme", "Pilates", "Yoga", "Fonksiyonel antrenman", "Hamilelik egzersizi", "Yaşlılar için egzersiz", "Diğer"], { allLabel: "Tüm alanlar", pickLabel: "Alanları seç" }),
      choice("nasil", "Nerede olsun?", ["Online", "Spor salonunda", "Evde", "Açık havada"]),
    ],
  },
  {
    slug: "grafik-tasarim",
    name: "Grafik tasarım",
    category: "Yazılım",
    categorySlug: "yazilim",
    aliases: ["grafik", "logo", "tasarim", "afis", "brosur", "kartvizit"],
    questions: [
      area("tur", "Ne tasarlanacak?", ["Logo", "Kurumsal kimlik", "Sosyal medya tasarımı", "Afiş veya broşür", "Ambalaj ve etiket", "Kartvizit", "İllüstrasyon", "Sunum", "Diğer"], { allLabel: "Tüm tasarımlar", pickLabel: "Tasarım türlerini seç" }, "multi"),
    ],
  },
  {
    slug: "havaalani-transfer",
    name: "Havaalanı transfer",
    category: "Ulaşım",
    categorySlug: "ulasim",
    aliases: ["havalimani", "transfer", "taksim", "sofor", "araba"],
    questions: [choice("kisi", "Kaç kişi?", ["1", "2", "3", "4", "5 veya daha fazla"])],
  },
  {
    slug: "cekici",
    name: "Çekici",
    category: "Ulaşım",
    categorySlug: "ulasim",
    aliases: ["cekici", "yol yardim", "aku", "araba", "arac"],
    questions: [
      area("arac", "Hangi araç?", ["Otomobil", "SUV veya hafif ticari", "Motosiklet", "Ağır vasıta"], { allLabel: "Tüm araçlar", pickLabel: "Araç türlerini seç" }),
      choice("neden", "Ne oldu?", ["Arıza", "Kaza", "Akü", "Lastik", "Yakıt bitti"]),
    ],
  },
  {
    slug: "lastikci",
    name: "Lastikçi",
    category: "Ulaşım",
    categorySlug: "ulasim",
    aliases: ["lastik", "jant", "rot balans", "araba"],
    questions: [choice("islem", "Ne yapılacak?", ["Lastik değişimi", "Tamir", "Rot balans", "Saklama"])],
  },
  {
    slug: "fizyoterapist",
    name: "Fizyoterapist",
    category: "Sağlık",
    categorySlug: "saglik",
    aliases: ["fizik tedavi", "fizyo", "bel", "boyun", "masaj"],
    questions: [
      area("sorun", "Hangi sorun için?", ["Bel fıtığı", "Boyun fıtığı", "Diz ağrısı", "Omuz ağrısı", "Spor yaralanması", "Ameliyat sonrası", "İnme ve nörolojik hastalıklar", "Skolyoz ve duruş bozukluğu", "Çocuk fizyoterapisi", "Diğer"], { allLabel: "Tüm sorunlar", pickLabel: "Uzmanlık alanlarını seç" }),
      choice("yer", "Seans nerede olsun?", ["Evde", "Uzmanın yerinde", "Fark etmez"]),
    ],
  },
  {
    slug: "psikolog",
    name: "Psikolog",
    category: "Sağlık",
    categorySlug: "saglik",
    aliases: ["psikolog", "terapi", "online", "danisman"],
    questions: [
      { id: "nasil", kind: "single", prompt: "Görüşme nasıl olsun?", options: [{ value: "Online", label: "Online (Zoom, WhatsApp vb.)" }, { value: "Psikoloğun muayenehanesinde", label: "Psikoloğun muayenehanesinde" }] },
      area("alan", "Hangi konuda destek istiyorsun?", ["Genel destek / konuşma ihtiyacı", "Depresyon", "Kaygı ve korku bozukluğu (anksiyete)", "Öfke kontrolü", "Özgüven eksikliği", "Sosyal fobi ve panik atak", "Evlilik ve aile terapisi", "Çocuk psikoloğu", "Ergen psikoloğu", "Cinsel terapi", "Bağımlılık (kumar / alkol / oyun vb.)", "Yeme bozukluğu", "Bipolar bozukluk", "Şizofreni", "Dikkat eksikliği (DEHB)", "Kişilik bozukluğu", "Diğer"], { allLabel: "Tüm konular", pickLabel: "Konuları seç" }, "multi"),
    ],
  },
  {
    slug: "evcil-hayvan-bakimi",
    name: "Evcil hayvan bakımı",
    category: "Evcil Hayvan",
    categorySlug: "evcil-hayvan",
    aliases: ["kedi", "kopek", "pet", "otel", "bakim"],
    questions: [
      area("tur", "Hangi hayvan?", ["Kedi", "Köpek", "Kuş", "Diğer"], { allLabel: "Tüm hayvanlar", pickLabel: "Hayvanları seç", suffix: "bakımı" }),
      choice("hizmet", "Nasıl bir bakım?", ["Evde ziyaret", "Bakıcının evinde konaklama", "Pet otel"]),
    ],
  },
  {
    slug: "kopek-gezdirme",
    name: "Köpek gezdirme",
    category: "Evcil Hayvan",
    categorySlug: "evcil-hayvan",
    aliases: ["kopek", "gezdirme", "yuruyus"],
    questions: [choice("siklik", "Ne sıklıkla?", ["Tek sefer", "Haftada birkaç gün", "Her gün"])],
  },
  {
    slug: "fotografci",
    name: "Fotoğrafçı",
    category: "Fotoğraf",
    categorySlug: "fotograf",
    aliases: ["fotograf", "dugun", "cekimi", "video", "drone"],
    questions: [
      area("tur", "Ne çekilecek?", ["Düğün", "Nişan", "Dış çekim", "Doğum günü", "Bebek ve yenidoğan", "Hamile", "Ürün", "Mekan ve emlak", "Portre ve vesikalık", "Kurumsal", "Diğer"], { allLabel: "Tüm çekimler", pickLabel: "Çekim türlerini seç", suffix: "çekimi" }),
    ],
  },
  {
    slug: "oyun-ablasi",
    name: "Oyun ablası",
    category: "Özel Ders",
    categorySlug: "ozel-ders",
    popular: true,
    aliases: ["oyun ablasi", "cocuk", "bakici", "oyun", "abla"],
    questions: [
      choice("yas", "Çocuk kaç yaşında?", ["3-5", "6-8", "9-12", "13 ve üzeri"]),
      choice("nasil", "Nerede olsun?", ["Evde", "Online"]),
      choice("siklik", "Ne sıklıkla?", ["Tek sefer", "Haftada 1", "Haftada birkaç gün", "Esnek"]),
    ],
  },
  {
    slug: "oyun-abisi",
    name: "Oyun abisi",
    category: "Özel Ders",
    categorySlug: "ozel-ders",
    popular: true,
    aliases: ["oyun abisi", "cocuk", "bakici", "oyun", "abi"],
    questions: [
      choice("yas", "Çocuk kaç yaşında?", ["3-5", "6-8", "9-12", "13 ve üzeri"]),
      choice("nasil", "Nerede olsun?", ["Evde", "Online"]),
      choice("siklik", "Ne sıklıkla?", ["Tek sefer", "Haftada 1", "Haftada birkaç gün", "Esnek"]),
    ],
  },
  {
    slug: "insaat-sonrasi-temizlik",
    name: "İnşaat sonrası temizlik",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["insaat", "tadilat sonrasi", "boya sonrasi", "kaba temizlik"],
    questions: [
      { id: "buyukluk", kind: "single", prompt: "Evin büyüklüğü nedir?", options: HOME_SIZES },
    ],
  },
  {
    slug: "cam-temizligi",
    name: "Cam temizliği",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["cam", "cam silme", "pencere", "vitrin"],
    questions: [
      area("yer", "Nerenin camları?", ["Ev", "Ofis veya dükkan", "Dış cephe (iple veya platformla)"], { allLabel: "Tüm cam işleri", pickLabel: "Cam işlerini seç" }),
      choice("adet", "Kaç pencere?", ["1-5", "6-10", "11-20", "20'den fazla"]),
    ],
  },
  {
    slug: "apartman-temizligi",
    name: "Apartman ve merdiven temizliği",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["apartman", "merdiven", "bina", "site"],
    questions: [
      choice("kat", "Bina kaç katlı?", ["1-3", "4-6", "7-10", "10'dan fazla"]),
      choice("siklik", "Ne sıklıkla?", ["Tek sefer", "Haftada 1", "Haftada 2 veya daha fazla"]),
    ],
  },
  {
    slug: "utu-hizmeti",
    name: "Evde ütü hizmeti",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["utu", "utuleme", "camasir"],
    questions: [
      choice("miktar", "Ne kadar çamaşır?", ["Az (1 sepet)", "Orta (2-3 sepet)", "Çok (3 sepetten fazla)"]),
    ],
  },
  {
    slug: "yatak-yikama",
    name: "Yatak yıkama",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["yatak", "baza", "leke"],
    questions: [
      choice("adet", "Kaç yatak?", ["1", "2", "3", "4 veya daha fazla"]),
    ],
  },
  {
    slug: "perde-yikama",
    name: "Perde ve stor yıkama",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["perde", "stor", "tul", "jaluzi"],
    questions: [
      choice("adet", "Kaç perde?", ["1-3", "4-6", "7 veya daha fazla"]),
    ],
  },
  {
    slug: "su-deposu-temizligi",
    name: "Su deposu temizliği",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["su deposu", "depo", "tank"],
    questions: [
      choice("hacim", "Depo kaç ton?", ["1-5 ton", "5-20 ton", "20 tondan büyük"]),
    ],
  },
  {
    slug: "arac-koltuk-yikama",
    name: "Araç koltuk yıkama",
    category: "Temizlik",
    categorySlug: "temizlik",
    aliases: ["arac koltuk", "oto koltuk", "oto yikama"],
    questions: [
      choice("arac", "Araç türü?", ["Otomobil", "SUV veya minivan", "Ticari araç"]),
    ],
  },
  {
    slug: "banyo-tadilati",
    name: "Banyo tadilatı",
    category: "Tadilat",
    categorySlug: "tadilat",
    popular: true,
    aliases: ["banyo", "banyo yenileme", "vitrifiye"],
    questions: [
      choice("kapsam", "Ne yapılacak?", ["Komple yenileme", "Fayans değişimi", "Vitrifiye değişimi", "Küçük tamir"]),
      { id: "malzeme", kind: "single", prompt: "Fiyata malzeme dahil olsun mu?", options: MATERIAL },
    ],
  },
  {
    slug: "mutfak-tadilati",
    name: "Mutfak tadilatı",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["mutfak", "mutfak yenileme", "mutfak dekorasyon"],
    questions: [
      choice("kapsam", "Ne yapılacak?", ["Komple yenileme", "Dolap ve tezgah", "Fayans", "Küçük tamir"]),
      { id: "malzeme", kind: "single", prompt: "Fiyata malzeme dahil olsun mu?", options: MATERIAL },
    ],
  },
  {
    slug: "komple-tadilat",
    name: "Komple ev tadilatı",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["tadilat", "anahtar teslim", "ev yenileme", "dekorasyon"],
    questions: [
      { id: "buyukluk", kind: "single", prompt: "Evin büyüklüğü nedir?", options: HOME_SIZES },
      { id: "malzeme", kind: "single", prompt: "Fiyata malzeme dahil olsun mu?", options: MATERIAL },
    ],
  },
  {
    slug: "pvc-pencere",
    name: "PVC pencere ve kapı",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["pimapen", "pvc", "pencere", "dograma"],
    questions: [
      choice("islem", "Ne yapılacak?", ["Yeni pencere", "Değişim", "Tamir ve ayar"]),
      choice("adet", "Kaç pencere veya kapı?", ["1", "2-3", "4-6", "7 veya daha fazla"]),
    ],
  },
  {
    slug: "mutfak-tezgahi",
    name: "Mutfak tezgahı",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["tezgah", "granit", "cimstone", "mermer"],
    questions: [
      area("tur", "Hangi malzeme?", ["Granit", "Çimstone / kuvars", "Mermer", "Laminat", "Akrilik (Corian)", "Fark etmez"], { allLabel: "Tüm tezgah türleri", pickLabel: "Tezgah türlerini seç" }),
    ],
  },
  {
    slug: "ic-mimar",
    name: "İç mimar",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["ic mimar", "dekorasyon", "tasarim", "proje"],
    questions: [
      area("yer", "Hangi mekan?", ["Ev", "Ofis", "Dükkan veya mağaza", "Kafe veya restoran", "Otel", "Diğer"], { allLabel: "Tüm mekanlar", pickLabel: "Mekan türlerini seç" }),
      choice("kapsam", "Ne istiyorsun?", ["Sadece proje ve çizim", "Proje ve uygulama", "Danışmanlık"]),
      { id: "nasil", kind: "single", prompt: "Görüşme nasıl olsun?", options: [{ value: "Online", label: "Online (Zoom, WhatsApp vb.)" }, { value: "Yüz yüze", label: "Yüz yüze" }] },
    ],
  },
  {
    slug: "duvar-kagidi",
    name: "Duvar kağıdı",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["duvar kagidi", "duvar dekorasyon"],
    questions: [
      choice("oda", "Kaç oda?", ["1", "2", "3", "4 veya daha fazla"]),
      { id: "malzeme", kind: "single", prompt: "Fiyata malzeme dahil olsun mu?", options: MATERIAL },
    ],
  },
  {
    slug: "cati-tamiri",
    name: "Çatı tamiri",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["cati", "kiremit", "oluk", "akinti"],
    questions: [
      area("islem", "Ne yapılacak?", ["Akıntı tamiri", "Kiremit aktarma", "Oluk tamiri", "Shingle veya membran kaplama", "Yeni çatı"], { allLabel: "Tüm çatı işleri", pickLabel: "Çatı işlerini seç" }),
    ],
  },
  {
    slug: "yalitim",
    name: "Su ve ısı yalıtımı",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["yalitim", "izolasyon", "mantolama", "nem", "rutubet"],
    questions: [
      area("tur", "Hangi yalıtım?", ["Çatı ve teras su yalıtımı", "Temel ve bodrum su yalıtımı", "Banyo ve ıslak hacim yalıtımı", "Isı yalıtımı (mantolama)", "Ses yalıtımı", "Nem ve rutubet"], { allLabel: "Tüm yalıtım işleri", pickLabel: "Yalıtım türlerini seç" }),
      { id: "metrekare", kind: "single", prompt: "Yaklaşık kaç metrekare?", options: AREA_SIZES },
    ],
  },
  {
    slug: "bahce-bakimi",
    name: "Bahçe bakımı",
    category: "Tadilat",
    categorySlug: "tadilat",
    aliases: ["bahce", "peyzaj", "cim", "budama", "bahcivan"],
    questions: [
      area("islem", "Ne yapılacak?", ["Düzenli bahçe bakımı", "Çim biçme", "Çim ekimi veya hazır çim", "Ağaç budama ve kesme", "Peyzaj düzenleme", "Otomatik sulama sistemi", "Bahçe ilaçlama"], { allLabel: "Tüm bahçe işleri", pickLabel: "Bahçe işlerini seç" }, "multi"),
      { id: "metrekare", kind: "single", prompt: "Yaklaşık kaç metrekare?", options: AREA_SIZES },
    ],
  },
  {
    slug: "sehirler-arasi-nakliyat",
    name: "Şehirler arası nakliyat",
    category: "Nakliyat",
    categorySlug: "nakliyat",
    popular: true,
    aliases: ["sehirler arasi", "il disi", "uzak mesafe"],
    questions: [
      choice("oda", "Kaç odalı ev?", ["1+1", "2+1", "3+1", "4+1 veya daha büyük", "Sadece birkaç eşya"]),
    ],
  },
  {
    slug: "esya-depolama",
    name: "Eşya depolama",
    category: "Nakliyat",
    categorySlug: "nakliyat",
    aliases: ["depo", "depolama", "esya saklama"],
    questions: [
      choice("miktar", "Ne kadar eşya?", ["Birkaç koli", "1 oda", "Komple ev"]),
      choice("sure", "Ne kadar süre?", ["1 ay", "1-3 ay", "3-6 ay", "6 aydan uzun"]),
    ],
  },
  {
    slug: "kurye",
    name: "Kurye",
    category: "Nakliyat",
    categorySlug: "nakliyat",
    aliases: ["kurye", "moto kurye", "paket", "evrak"],
    questions: [
      area("tur", "Ne gönderilecek?", ["Evrak", "Küçük paket (moto kurye)", "Büyük paket (araçlı kurye)"], { allLabel: "Tüm kurye işleri", pickLabel: "Kurye türlerini seç" }),
      choice("mesafe", "Mesafe?", ["Aynı ilçe", "Şehir içi", "Şehir dışı"]),
    ],
  },
  {
    slug: "su-kacagi-tespiti",
    name: "Su kaçağı tespiti",
    category: "Tamir",
    categorySlug: "tamir",
    popular: true,
    aliases: ["su kacagi", "kacak", "sizinti", "rutubet"],
    questions: [
      choice("yer", "Kaçak nerede?", ["Banyo", "Mutfak", "Duvar veya zemin", "Alt kata sızıyor", "Bilmiyorum"]),
    ],
  },
  {
    slug: "camci",
    name: "Camcı",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["cam", "camci", "kirik cam", "ayna"],
    questions: [
      choice("islem", "Ne yapılacak?", ["Kırık cam değişimi", "Ayna", "Yeni cam", "Diğer"]),
    ],
  },
  {
    slug: "kapi-tamiri",
    name: "Kapı montajı ve tamiri",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["kapi", "oda kapisi", "celik kapi", "mentese"],
    questions: [
      area("tur", "Hangi kapı?", ["Oda kapısı", "Çelik kapı", "Bina giriş kapısı", "Otomatik kapı", "Garaj kapısı"], { allLabel: "Tüm kapılar", pickLabel: "Kapı türlerini seç" }),
      choice("islem", "Ne yapılacak?", ["Yeni montaj", "Tamir ve ayar"]),
    ],
  },
  {
    slug: "uydu-anten",
    name: "Uydu ve anten",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["uydu", "canak anten", "anten", "tv yayini"],
    questions: [
      choice("islem", "Ne yapılacak?", ["Kurulum", "Ayar", "Arıza"]),
    ],
  },
  {
    slug: "tv-montaji",
    name: "TV duvar montajı",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["tv", "televizyon", "duvar aski"],
    questions: [
      choice("ekran", "Ekran boyutu?", ["43 inç ve altı", "50-55 inç", "65 inç ve üzeri"]),
    ],
  },
  {
    slug: "dogalgaz-tesisati",
    name: "Doğalgaz tesisatı",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["dogalgaz", "gaz", "ocak baglama", "kombi baglama"],
    questions: [
      choice("islem", "Ne yapılacak?", ["Yeni tesisat", "Tadilat", "Kaçak kontrolü", "Ocak bağlama"]),
    ],
  },
  {
    slug: "perde-montaji",
    name: "Perde ve korniş montajı",
    category: "Tamir",
    categorySlug: "tamir",
    aliases: ["kornis", "perde takma", "stor montaj", "raf"],
    questions: [
      choice("adet", "Kaç pencere?", ["1-2", "3-5", "6 veya daha fazla"]),
    ],
  },
  {
    slug: "soforlu-arac",
    name: "Şoförlü araç kiralama",
    category: "Ulaşım",
    categorySlug: "ulasim",
    aliases: ["soforlu", "vip", "ozel sofor", "vito"],
    questions: [
      choice("kisi", "Kaç kişi?", ["1-3", "4-7", "8-15", "15'ten fazla"]),
      choice("sure", "Ne kadar süre?", ["Tek yön", "Yarım gün", "Tam gün", "Birkaç gün"]),
    ],
  },
  {
    slug: "oto-detayli-temizlik",
    name: "Araç detaylı temizlik",
    category: "Ulaşım",
    categorySlug: "ulasim",
    aliases: ["oto yikama", "detayli temizlik", "pasta cila", "oto kuafor"],
    questions: [
      choice("islem", "Ne yapılacak?", ["İç ve dış temizlik", "Pasta cila", "Motor temizliği"]),
    ],
  },
  {
    slug: "catering",
    name: "Catering",
    category: "Organizasyon",
    categorySlug: "organizasyon",
    aliases: ["catering", "yemek", "ikram", "kokteyl"],
    questions: [
      area("tur", "Ne tür ikram?", ["Yemek", "Kokteyl", "Kahvaltı", "Tatlı ve pasta", "Mangal ve barbekü", "Kumanya ve kutu yemek"], { allLabel: "Tüm ikram türleri", pickLabel: "İkram türlerini seç" }, "multi"),
      choice("kisi", "Kaç kişilik?", ["1-20", "21-50", "51-100", "100'den fazla"]),
    ],
  },
  {
    slug: "pasta",
    name: "Pasta",
    category: "Organizasyon",
    categorySlug: "organizasyon",
    aliases: ["pasta", "dogum gunu pastasi", "butik pasta"],
    questions: [
      choice("kisi", "Kaç kişilik?", ["1-10", "11-20", "21-40", "40'tan fazla"]),
    ],
  },
  {
    slug: "dj",
    name: "DJ",
    category: "Organizasyon",
    categorySlug: "organizasyon",
    aliases: ["dj", "muzik", "parti"],
    questions: [
      choice("tur", "Ne için?", ["Düğün", "Doğum günü", "Kurumsal etkinlik", "Parti", "Diğer"]),
      choice("sure", "Ne kadar süre?", ["2 saat", "3-4 saat", "5 saat veya daha fazla"]),
    ],
  },
  {
    slug: "muzisyen",
    name: "Müzisyen ve orkestra",
    category: "Organizasyon",
    categorySlug: "organizasyon",
    aliases: ["muzisyen", "orkestra", "fasil", "davul zurna", "canli muzik"],
    questions: [
      area("tur", "Ne tür müzik?", ["Orkestra", "Fasıl", "Davul zurna", "Keman", "Saz ve bağlama", "Gitar veya piyano", "Solist (vokal)", "Diğer"], { allLabel: "Tüm müzik türleri", pickLabel: "Müzik türlerini seç" }),
      choice("etkinlik", "Ne için?", ["Düğün veya nişan", "Kına", "Doğum günü", "Kurumsal etkinlik", "Diğer"]),
    ],
  },
  {
    slug: "animator",
    name: "Palyaço ve animatör",
    category: "Organizasyon",
    categorySlug: "organizasyon",
    aliases: ["palyaco", "animator", "cocuk partisi"],
    questions: [
      choice("sure", "Ne kadar süre?", ["1 saat", "2 saat", "3 saat veya daha fazla"]),
    ],
  },
  {
    slug: "masa-sandalye-kiralama",
    name: "Masa ve sandalye kiralama",
    category: "Organizasyon",
    categorySlug: "organizasyon",
    aliases: ["masa", "sandalye", "kiralama", "bistro"],
    questions: [
      choice("kisi", "Kaç kişilik?", ["1-20", "21-50", "51-100", "100'den fazla"]),
    ],
  },
  {
    slug: "ses-sistemi-kiralama",
    name: "Ses sistemi kiralama",
    category: "Organizasyon",
    categorySlug: "organizasyon",
    aliases: ["ses sistemi", "hoparlor", "mikrofon", "isik"],
    questions: [
      choice("tur", "Ne lazım?", ["Ses sistemi", "Işık", "Ses ve ışık"]),
    ],
  },
  {
    slug: "susleme",
    name: "Süsleme ve çiçek",
    category: "Organizasyon",
    categorySlug: "organizasyon",
    aliases: ["susleme", "balon", "cicek", "cicekci"],
    questions: [
      choice("tur", "Ne için?", ["Doğum günü", "Nişan veya düğün", "Kurumsal", "Diğer"]),
    ],
  },
  {
    slug: "hasta-bakimi",
    name: "Hasta ve yaşlı bakımı",
    category: "Sağlık",
    categorySlug: "saglik",
    aliases: ["hasta bakici", "yasli bakimi", "refakatci"],
    questions: [
      area("kim", "Kime bakım verilecek?", ["Yaşlı bakımı", "Hasta bakımı", "Engelli bakımı", "Ameliyat sonrası refakat", "Hastanede refakat"], { allLabel: "Tüm bakım işleri", pickLabel: "Bakım türlerini seç" }),
      choice("sure", "Ne kadar süre?", ["Günlük birkaç saat", "Tam gün", "Yatılı"]),
    ],
  },
  {
    slug: "kopek-egitimi",
    name: "Köpek eğitimi",
    category: "Evcil Hayvan",
    categorySlug: "evcil-hayvan",
    aliases: ["kopek egitimi", "itaat", "egitmen"],
    questions: [
      area("tur", "Ne çalışılacak?", ["Temel itaat", "Yavru eğitimi", "Tuvalet eğitimi", "Davranış sorunu ve saldırganlık", "Koruma eğitimi"], { allLabel: "Tüm eğitimler", pickLabel: "Eğitim türlerini seç" }),
    ],
  },
  {
    slug: "pet-kuafor",
    name: "Evcil hayvan kuaförü",
    category: "Evcil Hayvan",
    categorySlug: "evcil-hayvan",
    aliases: ["pet kuafor", "tiras", "kedi tirasi", "kopek tirasi"],
    questions: [
      area("tur", "Hangi hayvan?", ["Kedi", "Köpek"], { allLabel: "Kedi ve köpek", pickLabel: "Hayvanları seç" }),
    ],
  },
  {
    slug: "evcil-hayvan-tasima",
    name: "Evcil hayvan taşıma",
    category: "Evcil Hayvan",
    categorySlug: "evcil-hayvan",
    aliases: ["pet taksi", "kedi tasima", "kopek tasima"],
    questions: [
      choice("mesafe", "Mesafe?", ["Şehir içi", "Şehir dışı"]),
    ],
  },
  {
    slug: "video-cekimi",
    name: "Video çekimi",
    category: "Fotoğraf",
    categorySlug: "fotograf",
    aliases: ["video", "klip", "tanitim filmi", "dugun videosu"],
    questions: [
      area("tur", "Ne çekilecek?", ["Düğün veya nişan", "Tanıtım videosu", "Etkinlik", "Klip", "Sosyal medya içeriği", "Diğer"], { allLabel: "Tüm çekimler", pickLabel: "Çekim türlerini seç" }),
    ],
  },
  {
    slug: "drone-cekimi",
    name: "Drone çekimi",
    category: "Fotoğraf",
    categorySlug: "fotograf",
    aliases: ["drone", "havadan", "emlak cekimi"],
    questions: [
      area("tur", "Ne çekilecek?", ["Emlak", "Etkinlik", "Tanıtım", "İnşaat takibi", "Diğer"], { allLabel: "Tüm çekimler", pickLabel: "Çekim türlerini seç" }),
    ],
  },
  {
    slug: "sosyal-medya-yonetimi",
    name: "Sosyal medya yönetimi",
    category: "Yazılım",
    categorySlug: "yazilim",
    aliases: ["sosyal medya", "instagram", "reklam", "icerik"],
    questions: [
      area("platform", "Hangi platformlar?", ["Instagram", "TikTok", "Facebook", "YouTube", "LinkedIn", "X (Twitter)"], { allLabel: "Tüm platformlar", pickLabel: "Platformları seç" }, "multi"),
      choice("hesap", "Kaç hesap?", ["1", "2-3", "4 veya daha fazla"]),
    ],
  },
  {
    slug: "video-kurgu",
    name: "Video kurgu",
    category: "Yazılım",
    categorySlug: "yazilim",
    aliases: ["video kurgu", "montaj", "edit", "reels"],
    questions: [
      area("tur", "Ne tür video?", ["YouTube videosu", "Reels / TikTok", "Düğün videosu", "Tanıtım ve reklam filmi", "Animasyon ve motion", "Diğer"], { allLabel: "Tüm video türleri", pickLabel: "Video türlerini seç" }),
      choice("sure", "Video uzunluğu?", ["1 dakikadan kısa", "1-5 dakika", "5 dakikadan uzun"]),
    ],
  },
  {
    slug: "seo",
    name: "SEO ve dijital pazarlama",
    category: "Yazılım",
    categorySlug: "yazilim",
    aliases: ["seo", "google", "dijital pazarlama", "reklam"],
    questions: [
      area("tur", "Ne lazım?", ["SEO", "Google reklamları", "Sosyal medya reklamları", "E-posta pazarlama", "Dijital pazarlama danışmanlığı"], { allLabel: "Tüm pazarlama işleri", pickLabel: "İş türlerini seç" }, "multi"),
    ],
  },
];

const bySlug = new Map(SERVICES.map((service) => [service.slug, service]));

export function getService(slug: string): ServiceDef | undefined {
  return bySlug.get(slug);
}

export function servicesInCategory(categorySlug: string): ServiceDef[] {
  return SERVICES.filter((service) => service.categorySlug === categorySlug);
}

export function visibleQuestions(
  service: ServiceDef,
  answers: Record<string, string>,
): ServiceQuestion[] {
  return service.questions.filter((question) => !question.when || question.when(answers));
}
