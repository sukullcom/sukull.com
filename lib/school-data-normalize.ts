/**
 * Okul master CSV normalizasyonu: şehir/ilçe yazım birleştirme, hatalı üniversite satırları.
 */

/** İlçe yazımı — ASCII/tekrar varyant → doğru (İstanbul örnekleri + genel). */
export const DISTRICT_CANONICAL_OVERRIDES: Record<string, string> = {
  BAGCILAR: "BAĞCILAR",
  BAHCELİEVLER: "BAHÇELİEVLER",
  BAHCELIEVLER: "BAHÇELİEVLER",
  GAZİOSMANPASA: "GAZİOSMANPAŞA",
  GAZIOSMANPASA: "GAZİOSMANPAŞA",
  KADİKÖY: "KADIKÖY",
  KADIKOY: "KADIKÖY",
  KÜÇÜKCEKMECE: "KÜÇÜKÇEKMECE",
  KUCUKCEKMECE: "KÜÇÜKÇEKMECE",
  ŞIŞLI: "ŞİŞLİ",
  SISLI: "ŞİŞLİ",
  BEYOĞLU: "BEYOĞLU",
  BEYOGLU: "BEYOĞLU",
  BÜYÜKÇEKMECE: "BÜYÜKÇEKMECE",
  BUYUKCEKMECE: "BÜYÜKÇEKMECE",
  EYÜPSULTAN: "EYÜPSULTAN",
  EYUPSULTAN: "EYÜPSULTAN",
  ÇEKMEKÖY: "ÇEKMEKÖY",
  CEKMEKOY: "ÇEKMEKÖY",
  ÜMRANİYE: "ÜMRANİYE",
  UMRANIYE: "ÜMRANİYE",
  ÜSKÜDAR: "ÜSKÜDAR",
  USKUDAR: "ÜSKÜDAR",
};

const TURKISH_LETTERS = /[ğüşıöçĞÜŞİÖÇ]/g;

/** Türkçe karakter sayısı — canonical ilçe seçiminde ASCII varyantından üstün. */
export function turkishLetterScore(value: string): number {
  return value.match(TURKISH_LETTERS)?.length ?? 0;
}

/** İlçe karşılaştırma anahtarı (aynı ilçenin yazım varyantları). */
export function foldDistrictKey(district: string): string {
  return district
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/İ/g, "I")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C");
}

export function pickCanonicalDistrict(variants: string[]): string {
  if (variants.length === 0) return "";
  if (variants.length === 1) return variants[0]!;

  const sorted = [...variants].sort((a, b) => {
    const scoreDiff = turkishLetterScore(b) - turkishLetterScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.localeCompare(b, "tr");
  });
  return sorted[0]!;
}

export type DistrictAggRow = { district: string; count: number };

/** API ilçe listesi: BAGCILAR + BAĞCILAR → tek BAĞCILAR (sayılar birleşir). */
export function mergeDistrictAggregates(rows: DistrictAggRow[]): DistrictAggRow[] {
  const groups = new Map<string, { names: string[]; count: number }>();
  for (const r of rows) {
    const fold = foldDistrictKey(r.district);
    const g = groups.get(fold) ?? { names: [], count: 0 };
    if (!g.names.includes(r.district)) g.names.push(r.district);
    g.count += Number(r.count);
    groups.set(fold, g);
  }
  return Array.from(groups.values())
    .map((g) => ({
      district: normalizeDistrictName(pickCanonicalDistrict(g.names), ""),
      count: g.count,
    }))
    .sort((a, b) => a.district.localeCompare(b.district, "tr"));
}

export function normalizeDistrictName(district: string, cityUpper: string): string {
  const trimmed = district.trim();
  const upper = trimmed.toLocaleUpperCase("tr-TR");
  const override = DISTRICT_CANONICAL_OVERRIDES[upper];
  if (override) return override;
  void cityUpper;
  return upper;
}

/** Üniversite satırında şehir sütununa okul adı yazılmışsa il adına çevir. */
export function fixUniversityCity(city: string, schoolName: string, category: string): string {
  if (category !== "University") return city.trim().toLocaleUpperCase("tr-TR");

  const c = city.trim();
  const upper = c.toLocaleUpperCase("tr-TR");
  const name = schoolName.trim();

  const looksLikeSchoolName =
    /üniversite|üniversitesi|yüksekokul|yüksekokulu/i.test(c) ||
    (name.length > 0 && c.toLocaleUpperCase("tr-TR") === name.toLocaleUpperCase("tr-TR"));

  if (!looksLikeSchoolName) return upper;

  const m = name.match(
    /^(İstanbul|Istanbul|Ankara|İzmir|Izmir|Bursa|Antalya|Adana|Konya|Kocaeli|Gaziantep|Mersin|Kayseri|Trabzon|Muğla|Mugla|Aydın|Aydin|Tekirdağ|Tekirdag|Balıkesir|Balikesir|Eskişehir|Eskisehir|Denizli|Samsun|Hatay|Manisa|Sakarya|Diyarbakır|Diyarbakir|Şanlıurfa|Sanliurfa|Van|Malatya|Erzurum|Batman|Elazığ|Elazig|Kütahya|Kutahya|Çanakkale|Canakkale|Afyon|Uşak|Usak|Isparta|Bolu|Edirne|Ordu|Rize|Kırklareli|Kirklareli|Nevşehir|Nevsehir)\b/i,
  );
  if (m) {
    const raw = m[1]!;
    const map: Record<string, string> = {
      Istanbul: "İSTANBUL",
      Izmir: "İZMİR",
      Mugla: "MUĞLA",
      Aydin: "AYDIN",
      Tekirdag: "TEKİRDAĞ",
      Balikesir: "BALIKESİR",
      Eskisehir: "ESKİŞEHİR",
      Diyarbakir: "DİYARBAKIR",
      Sanliurfa: "ŞANLIURFA",
      Elazig: "ELAZIĞ",
      Kutahya: "KÜTAHYA",
      Canakkale: "ÇANAKKALE",
      Usak: "UŞAK",
      Kirklareli: "KIRKLARELİ",
      Nevsehir: "NEVŞEHİR",
    };
    const key = raw.replace(/İ/g, "I").toLowerCase();
    for (const [k, v] of Object.entries(map)) {
      if (k.toLowerCase() === key || raw.toLocaleUpperCase("tr-TR") === k.toLocaleUpperCase("tr-TR")) {
        return v;
      }
    }
    return raw.toLocaleUpperCase("tr-TR");
  }

  if (/^İstanbul|^Istanbul/i.test(name)) return "İSTANBUL";
  return upper;
}

/** Üniversitelerde ilçe etiketi (UI’da tek seçenek). */
export const UNIVERSITY_DISTRICT_LABEL = "Kampüs";

/** Şehir dropdown — il adı değil (eski hatalı import: üniversite adı city sütununda). */
export function isValidSchoolCity(city: string): boolean {
  const c = city.trim();
  if (!c || c.length > 20) return false;
  if (/YÜKSEKOKULU|YUKSEKOKULU|MESLEK YÜKSEK|MESLEK YUKSEK|ÜNİVERSİTESİ|UNIVERSITESI/i.test(c)) {
    return false;
  }
  return true;
}

/** Eşleştirme / dedup için marka anahtarı */
export function normalizeMatchKey(name: string): string {
  let s = name
    .toLocaleUpperCase("tr-TR")
    .replace(/ÖZEL\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const dropSuffixes = [
    " İLKOKULU",
    " ORTAOKULU",
    " LİSESİ",
    " LİSE",
    " ANAOKULU",
    " KAMPÜSÜ",
    " KAMPUSU",
    " KOLEJİ",
    " KOLEJ",
    " OKULLARI",
    " OKULU",
    " MESLEKİ VE TEKNİK ANADOLU LİSESİ",
    " ANADOLU LİSESİ",
    " FEN LİSESİ",
  ];
  for (const suf of dropSuffixes) {
    if (s.endsWith(suf)) s = s.slice(0, -suf.length).trim();
  }

  return s
    .replace(/[^A-ZÇĞİÖŞÜ0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeUniversityDistrict(district: string, category: string): string {
  if (category !== "University") return district;
  const d = district.trim().toLocaleUpperCase("tr-TR");
  if (d === "KAMPÜS" || d === "KAMPUS") return UNIVERSITY_DISTRICT_LABEL;
  return district.trim();
}

export type SchoolCsvRow = {
  city: string;
  district: string;
  category: string;
  kind: string;
  schoolName: string;
};

export type NormalizeSchoolCsvResult = {
  rows: SchoolCsvRow[];
  cityFixes: number;
  districtMerges: number;
};

/**
 * Tüm satırlarda ilçe canonical map (şehir + fold key) ve üniversite şehir düzeltmesi.
 */
export function normalizeSchoolCsvRows(rows: SchoolCsvRow[]): NormalizeSchoolCsvResult {
  let cityFixes = 0;
  const districtGroups = new Map<string, Map<string, string[]>>();

  const pass1 = rows.map((row) => {
    const fixedCity = fixUniversityCity(row.city, row.schoolName, row.category);
    if (fixedCity !== row.city.trim().toLocaleUpperCase("tr-TR")) cityFixes++;

    const cityUpper = fixedCity;
    const districtUpper = row.district.trim().toLocaleUpperCase("tr-TR");
    const fold = foldDistrictKey(districtUpper);
    const byCity = districtGroups.get(cityUpper) ?? new Map<string, string[]>();
    const list = byCity.get(fold) ?? [];
    if (!list.includes(districtUpper)) list.push(districtUpper);
    byCity.set(fold, list);
    districtGroups.set(cityUpper, byCity);

    return { ...row, city: cityUpper, district: districtUpper };
  });

  const canonicalByCityFold = new Map<string, string>();
  Array.from(districtGroups.entries()).forEach(([city, byFold]) => {
    Array.from(byFold.entries()).forEach(([fold, variants]) => {
      const withOverrides = variants.map((v: string) => DISTRICT_CANONICAL_OVERRIDES[v] ?? v);
      const canonical = pickCanonicalDistrict(Array.from(new Set(withOverrides)));
      canonicalByCityFold.set(`${city}\0${fold}`, normalizeDistrictName(canonical, city));
    });
  });

  let districtMerges = 0;
  const pass2 = pass1.map((row) => {
    const fold = foldDistrictKey(row.district);
    let canonical =
      canonicalByCityFold.get(`${row.city}\0${fold}`) ??
      normalizeDistrictName(row.district, row.city);
    canonical = normalizeUniversityDistrict(canonical, row.category);
    if (canonical !== row.district) districtMerges++;
    return { ...row, district: canonical };
  });

  return { rows: pass2, cityFixes, districtMerges };
}
