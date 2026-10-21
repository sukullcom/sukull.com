import { SERVICES, getService, type ServiceDef } from "@/lib/marketplace/catalog";

export function normalizeTr(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

export type ServicePreset = { questionId: string; value: string };

export type ServiceSuggestion = {
  key: string;
  label: string;
  hint: string;
  service: ServiceDef;
  preset?: ServicePreset;
  score: number;
};

/**
 * Kullanıcının kendi kelimeleri -> ilgili hizmetler ve seçenekler.
 * Harf eşleşmesi yetmediğinde ("ders" -> Matematik) buradan bulunur.
 */
const CONCEPTS: { terms: string[]; services: string[]; options?: { slug: string; questionId: string }[] }[] = [
  {
    terms: ["ders", "hoca", "ogretmen", "egitim", "kurs", "etut", "okul", "sinav", "ogrenmek", "calistir"],
    services: ["ozel-ders", "direksiyon-dersi"],
    options: [
      { slug: "ozel-ders", questionId: "ders" },
      { slug: "ozel-ders", questionId: "okul-dersi" },
    ],
  },
  {
    terms: ["dil", "yabanci", "ingilizce", "almanca", "fransizca", "ispanyolca", "arapca", "rusca"],
    services: ["ozel-ders"],
  },
  { terms: ["muzik", "gitar", "piyano", "keman", "saz", "bateri", "san"], services: ["ozel-ders"] },
  { terms: ["lgs", "yks", "tyt", "ayt", "kpss", "universite sinavi"], services: ["ozel-ders"] },
  {
    terms: ["cocuk", "bebek", "bakici", "dadi", "oyun", "abla", "abi"],
    services: ["oyun-ablasi", "oyun-abisi", "ozel-ders"],
  },
  {
    terms: ["temizlik", "temizlikci", "yardimci", "gundelikci", "ev isi", "silmek"],
    services: ["ev-temizligi", "bos-ev-temizligi", "ofis-temizligi", "koltuk-yikama", "hali-yikama"],
  },
  {
    terms: ["usta", "tamirci", "tadilat", "tamir", "bozuk", "ariza", "kirik"],
    services: ["su-tesisati", "elektrikci", "beyaz-esya", "kombi-tamiri", "klima", "boya-badana", "fayans", "mobilya-montaj"],
  },
  { terms: ["tesisat", "tesisatci", "su", "musluk", "kacak", "lavabo", "tuvalet", "gider"], services: ["su-tesisati", "tikaniklik-acma"] },
  { terms: ["elektrik", "priz", "sigorta", "avize", "lamba", "kablo"], services: ["elektrikci"] },
  { terms: ["kapi", "kilit", "anahtar"], services: ["cilingir"] },
  { terms: ["boya", "badana", "duvar", "boyaci"], services: ["boya-badana"] },
  { terms: ["tasima", "tasinma", "nakliye", "evden eve", "esya", "kamyon"], services: ["nakliyat"] },
  {
    terms: ["araba", "araç", "arac", "oto", "otomobil", "lastik", "yol", "ehliyet"],
    services: ["arac-kiralama", "direksiyon-dersi", "arac-kaplama", "cekici", "lastikci", "havaalani-transfer"],
  },
  { terms: ["havaalani", "transfer", "ulasim", "sofor"], services: ["havaalani-transfer", "arac-kiralama"] },
  {
    terms: ["yazilim", "web", "site", "uygulama", "mobil", "program", "kod", "yapay zeka", "bilgisayar"],
    services: ["yazilim-projesi", "ozel-ders"],
  },
  { terms: ["saglik", "agri", "bel", "boyun", "terapi", "spor"], services: ["fizyoterapist", "psikolog"] },
  { terms: ["psikolog", "terapist", "danisman", "stres", "kaygi", "depresyon"], services: ["psikolog"] },
  { terms: ["kedi", "kopek", "hayvan", "pet", "evcil"], services: ["evcil-hayvan-bakimi", "kopek-gezdirme"] },
  { terms: ["foto", "fotograf", "cekim", "dugun", "nisan", "video"], services: ["fotografci", "organizasyon"] },
  { terms: ["dugun", "nisan", "parti", "dogum gunu", "kutlama", "etkinlik"], services: ["organizasyon", "fotografci"] },
  { terms: ["bocek", "hamam bocegi", "fare", "karinca", "ilaclama"], services: ["bocek-ilaclama"] },
  { terms: ["isinma", "kombi", "petek", "kalorifer", "sicak su"], services: ["kombi-tamiri", "petek-temizleme"] },
  { terms: ["serinlik", "klima", "sogutma"], services: ["klima"] },
  { terms: ["buzdolabi", "camasir makinesi", "bulasik makinesi", "firin", "beyaz esya"], services: ["beyaz-esya"] },
  { terms: ["mutfak", "dolap", "banyo", "dus", "fayans", "seramik"], services: ["mutfak-dolabi", "dusakabin", "fayans"] },
];

/** Öneri üretilebilecek seçenekli sorular. Adet, metrekare gibi sayılar öneri olmaz. */
const OPTION_QUESTIONS = new Set([
  "ders",
  "okul-dersi",
  "dil",
  "enstruman",
  "muzik",
  "dans",
  "spor",
  "alan",
  "tur",
  "islem",
  "sorun",
  "cihaz",
  "neden",
  "platform",
  "uzmanlik",
]);

function wordMatches(queryWord: string, term: string): boolean {
  if (queryWord.length < 2) return false;
  return term.split(" ").some((word) => {
    if (word.startsWith(queryWord)) return true;
    // Türkçe ekler: "dersi", "matematikçi", "temizlikçi"
    return queryWord.length >= 4 && word.length >= 3 && queryWord.startsWith(word);
  });
}

function textMatches(query: string, text: string): boolean {
  const parts = query.split(" ").filter(Boolean);
  return parts.length > 0 && parts.every((part) => wordMatches(part, text));
}

function directScore(q: string, service: ServiceDef): number {
  const name = normalizeTr(service.name);
  const aliases = service.aliases.map((alias) => normalizeTr(alias));
  if (name.startsWith(q)) return 100;
  if (aliases.some((alias) => alias.startsWith(q))) return 85;
  if (name.includes(q)) return 70;
  if (aliases.some((alias) => alias.includes(q))) return 60;
  if (textMatches(q, `${name} ${aliases.join(" ")}`)) return 50;
  if (textMatches(q, normalizeTr(service.category))) return 25;
  return 0;
}

export function searchSuggestions(query: string, limit = 8): ServiceSuggestion[] {
  const q = normalizeTr(query);
  if (!q) {
    return SERVICES.filter((service) => service.popular)
      .slice(0, limit)
      .map((service) => ({ key: service.slug, label: service.name, hint: service.category, service, score: 1 }));
  }

  const out = new Map<string, ServiceSuggestion>();
  function add(item: ServiceSuggestion) {
    const current = out.get(item.key);
    if (!current || current.score < item.score) out.set(item.key, item);
  }

  for (const service of SERVICES) {
    const score = directScore(q, service);
    if (score > 0) add({ key: service.slug, label: service.name, hint: service.category, service, score });
  }

  for (const concept of CONCEPTS) {
    if (!concept.terms.some((term) => textMatches(q, term) || normalizeTr(term) === q)) continue;
    concept.services.forEach((slug, index) => {
      const service = getService(slug);
      if (service) add({ key: slug, label: service.name, hint: service.category, service, score: 40 - index });
    });
    for (const source of concept.options ?? []) {
      const service = getService(source.slug);
      const question = service?.questions.find((item) => item.id === source.questionId);
      if (!service || !question) continue;
      (question.options ?? []).forEach((option, index) => {
        add({
          key: `${service.slug}:${option.value}`,
          label: option.value,
          hint: service.name,
          service,
          preset: { questionId: question.id, value: option.value },
          score: 30 - index * 0.1,
        });
      });
    }
  }

  // Seçenek adı aranıyorsa ("matematik", "kilit değişimi") doğrudan o seçenekle başlat.
  for (const service of SERVICES) {
    for (const question of service.questions) {
      if (!OPTION_QUESTIONS.has(question.id)) continue;
      for (const option of question.options ?? []) {
        const label = normalizeTr(option.value);
        if (q.length < 3 || !(label.startsWith(q) || textMatches(q, label))) continue;
        add({
          key: `${service.slug}:${option.value}`,
          label: option.value,
          hint: service.name,
          service,
          preset: { questionId: question.id, value: option.value },
          score: label.startsWith(q) ? 90 : 55,
        });
      }
    }
  }

  return Array.from(out.values())
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "tr"))
    .slice(0, limit);
}

/** Hizmet listesi: aynı hizmet bir kez, en iyi eşleşme sırasıyla. */
export function searchServices(query: string, limit = 8): ServiceDef[] {
  const seen = new Set<string>();
  const list: ServiceDef[] = [];
  for (const item of searchSuggestions(query, 200)) {
    if (seen.has(item.service.slug)) continue;
    seen.add(item.service.slug);
    list.push(item.service);
    if (list.length >= limit) break;
  }
  return list;
}

export function suggestionHref(item: Pick<ServiceSuggestion, "service" | "preset">): string {
  const params = new URLSearchParams({ hizmet: item.service.slug });
  if (item.preset) params.set("on", `${item.preset.questionId}:${item.preset.value}`);
  return `/talep/yeni?${params.toString()}`;
}

/** URL'den gelen ön seçimi doğrular. Sadece hizmetin gerçek seçeneklerini kabul eder. */
export function parsePreset(slug: string, raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  const service = getService(slug);
  const split = raw.indexOf(":");
  if (!service || split <= 0) return {};
  const questionId = raw.slice(0, split);
  const value = raw.slice(split + 1);
  const question = service.questions.find((item) => item.id === questionId);
  if (!question || question.kind === "text") return {};
  if (!(question.options ?? []).some((option) => option.value === value)) return {};
  if (question.parent) return { [question.parent.questionId]: question.parent.value, [questionId]: value };
  return { [questionId]: value };
}
