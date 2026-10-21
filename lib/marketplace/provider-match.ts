import { LESSON_FOLLOW_UPS, getService } from "@/lib/marketplace/catalog";
import { normalizeTr } from "@/lib/marketplace/search";

/** provider_services.filters: seçilen çeşitler. Boş veya yoksa hizmetin tamamı. */
export type ProviderFilters = { variants?: string[] };

export type ProviderServiceEntry = { slug: string; filters: ProviderFilters };

type Answers = Map<string, string>;

export type VariantGroup = { title?: string; values: string[] };

type VariantSet = {
  /** Hizmet adını tamamlayan etiket: "Matematik" -> "Matematik özel ders". */
  label: (value: string) => string;
  allLabel: string;
  pickLabel: string;
  groups: VariantGroup[];
  /** Talep bu çeşide uyuyor mu. Çeşidi belirsiz talepler ("Diğer") her çeşide uyar. */
  matches: (answers: Answers, value: string) => boolean;
  /** Eski kayıtlardaki grup adları -> o grubun tüm çeşitleri. */
  legacy?: Record<string, string[]>;
};

const SCHOOL_LEVELS = ["İlkokul", "Ortaokul", "Lise", "Üniversite"];
const UNSPECIFIED = new Set(["Diğer", "Diğer platformlar", "Emin değilim", "Bilmiyorum", "Fark etmez", "Tercihim yok"]);

function optionValues(slug: string, questionId: string): string[] {
  const question = getService(slug)?.questions.find((item) => item.id === questionId);
  return (question?.options ?? []).map((option) => option.value);
}

function splitMulti(value: string | undefined): string[] {
  return (value ?? "").split(",").map((part) => part.trim()).filter(Boolean);
}

function lessonVariants(): VariantSet {
  const ders = optionValues("ozel-ders", "ders");
  const school = optionValues("ozel-ders", "okul-dersi").filter((value) => value !== "İngilizce");
  const exams = ["LGS", "TYT", "AYT", "KPSS", "ALES", "DGS", "YDS / YÖKDİL", "IELTS / TOEFL"].filter((value) => ders.includes(value));
  const tech = ["Yazılım", "Kodlama eğitimi", "Yapay zeka eğitimi", "Bilgisayar eğitimi"].filter((value) =>
    ders.includes(value),
  );
  const followUps = LESSON_FOLLOW_UPS.map((item) => ({
    title: item.parent,
    questionId: item.id,
    values: item.options.filter((value) => !UNSPECIFIED.has(value)) as string[],
  }));
  const grouped = new Set([...school, ...exams, ...tech, ...followUps.map((item) => item.title)]);
  const other = ders.filter((value) => !grouped.has(value) && !SCHOOL_LEVELS.includes(value));
  const followUpOf = new Map(followUps.flatMap((group) => group.values.map((value) => [value, group])));

  return {
    label: (value) => `${value} özel ders`,
    allLabel: "Tüm dersler",
    pickLabel: "Dersleri seç",
    groups: [
      { title: "Okul dersleri", values: school },
      { title: "Sınavlar", values: exams },
      ...followUps.map((group) => ({ title: group.title, values: group.values })),
      { title: "Yazılım ve bilgisayar", values: tech },
      { title: "Diğer dersler", values: other },
    ],
    legacy: Object.fromEntries(followUps.map((group) => [group.title, group.values])),
    matches: (answers, value) => {
      const lesson = answers.get("ders");
      const isSchool = !!lesson && SCHOOL_LEVELS.includes(lesson);
      const group = followUpOf.get(value);
      if (group) {
        if (value === "İngilizce" && isSchool && answers.get("okul-dersi") === "İngilizce") return true;
        if (lesson !== group.title) return false;
        const sub = answers.get(group.questionId);
        return !sub || sub === value || UNSPECIFIED.has(sub);
      }
      return lesson === value || (isSchool && answers.get("okul-dersi") === value);
    },
  };
}

function withSuffix(value: string, suffix: string | undefined): string {
  if (!suffix) return value;
  const last = normalizeTr(suffix).split(" ").pop() ?? "";
  return normalizeTr(value).endsWith(last) ? value : `${value} ${suffix}`;
}

/**
 * Katalogda `variant` ile işaretli soru. Talep eden belirsiz cevap verdiyse ("Diğer")
 * ilan o hizmeti veren herkese gider; çoklu seçimde biri tutması yeter.
 */
function questionVariants(slug: string): VariantSet | null {
  const question = getService(slug)?.questions.find((item) => item.variant);
  if (!question?.variant) return null;
  const spec = question.variant;
  const values = (question.options ?? []).map((option) => option.value).filter((value) => !UNSPECIFIED.has(value));
  return {
    label: (value) => withSuffix(value, spec.suffix),
    allLabel: spec.allLabel,
    pickLabel: spec.pickLabel,
    groups: [{ values }],
    matches: (answers, value) => {
      const raw = answers.get(question.id);
      const given = question.kind === "multi" ? splitMulti(raw) : [raw ?? ""];
      const known = given.filter((item) => values.includes(item));
      return known.length === 0 || known.includes(value);
    },
  };
}

/** Grup yapısı katalogdan çıkarılamayan hizmetler. */
const CUSTOM_VARIANTS: Record<string, () => VariantSet> = {
  "ozel-ders": lessonVariants,
};

const variantCache = new Map<string, VariantSet | null>();

/**
 * Hizmet verenin ayrı ayrı seçebileceği çeşitler. Sadece işin kendisini değiştiren
 * sorular; online/yüz yüze, metrekare, adet gibi detaylar ilanı süzmez.
 */
function variantSet(slug: string): VariantSet | null {
  if (!variantCache.has(slug)) {
    variantCache.set(slug, CUSTOM_VARIANTS[slug]?.() ?? questionVariants(slug));
  }
  return variantCache.get(slug) ?? null;
}

/** Çeşit adında geçmeyen ama aynı çeşidi anlatan kelimeler (normalize edilmiş). */
const VARIANT_TERMS: Record<string, Record<string, string[]>> = {
  "ozel-ders": {
    Matematik: ["mat"],
    Bağlama: ["saz"],
    "Şan (vokal)": ["vokal", "san", "sarki"],
    Solfej: ["nota"],
    "Kodlama eğitimi": ["kod", "python", "scratch", "programlama"],
    "Yapay zeka eğitimi": ["yapay"],
    TYT: ["yks", "universite sinavi"],
    AYT: ["yks", "universite sinavi"],
  },
  nakliyat: {
    "Evden eve nakliyat hizmeti": ["ev tasima", "tasinma"],
    "Araç taşıma": ["araba", "oto"],
  },
  "kisisel-antrenor": { Fitness: ["spor", "vucut"], "Kas geliştirme": ["vucut gelistirme"] },
  psikolog: {
    "Kaygı ve korku bozukluğu (anksiyete)": ["anksiyete", "kaygi"],
    "Sosyal fobi ve panik atak": ["panik", "fobi"],
    "Evlilik ve aile terapisi": ["cift", "evlilik", "aile"],
    "Çocuk psikoloğu": ["cocuk"],
    "Ergen psikoloğu": ["ergen", "genc"],
    "Dikkat eksikliği (DEHB)": ["dehb", "dikkat"],
  },
  "telefon-tamiri": { iPhone: ["apple", "ios"] },
  "bilgisayar-tamiri": { "Mac (Apple)": ["macbook", "apple", "imac"] },
  "yazilim-projesi": {
    "Web sitesi": ["web", "site", "internet"],
    "Mobil uygulama": ["mobil", "android", "ios", "uygulama"],
    "Oyun geliştirme": ["oyun", "unity", "unreal"],
    "Veri analizi": ["veri", "analiz", "rapor", "excel"],
    "Yapay zeka": ["yapay", "ai", "makine"],
    "E-ticaret": ["eticaret", "magaza"],
    "İş otomasyonu": ["otomasyon", "bot"],
    "Masaüstü program": ["masaustu", "windows", "program"],
  },
};

export type ServiceVariants = Pick<VariantSet, "groups" | "allLabel" | "pickLabel" | "label"> & { values: string[] };

export function serviceVariants(slug: string): ServiceVariants | null {
  const set = variantSet(slug);
  if (!set) return null;
  const groups = set.groups.filter((group) => group.values.length > 0);
  return {
    groups,
    values: groups.flatMap((group) => group.values),
    allLabel: set.allLabel,
    pickLabel: set.pickLabel,
    label: set.label,
  };
}

export function variantMatchesQuery(slug: string, value: string, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const variants = serviceVariants(slug);
  if (!variants) return false;
  if (normalizeTr(variants.label(value)).includes(normalizedQuery)) return true;
  const group = variants.groups.find((item) => item.values.includes(value));
  if (group?.title && normalizedQuery.length >= 3 && normalizeTr(group.title).includes(normalizedQuery)) return true;
  return (VARIANT_TERMS[slug]?.[value] ?? []).some(
    (term) => term === normalizedQuery || (normalizedQuery.length >= 3 && term.startsWith(normalizedQuery)),
  );
}

/** Bilinmeyen çeşitleri atar, eski grup adlarını açar; çeşidi olmayan hizmette boş döner. */
export function cleanFilters(slug: string, raw: unknown): ProviderFilters {
  const set = variantSet(slug);
  const variants = serviceVariants(slug);
  if (!set || !variants || !raw || typeof raw !== "object") return {};
  const list = (raw as { variants?: unknown }).variants;
  if (!Array.isArray(list)) return {};
  const legacy = set.legacy ?? {};
  const wanted = new Set(
    list.flatMap((value) => (typeof value !== "string" ? [] : legacy[value] ?? [value])),
  );
  const kept = variants.values.filter((value) => wanted.has(value));
  return kept.length > 0 && kept.length < variants.values.length ? { variants: kept } : {};
}

/** Talep, hizmet verenin eklediği çeşitlerden birine uyuyor mu. Çeşit seçilmediyse hepsi uyar. */
export function requestMatchesEntry(
  slug: string,
  filters: ProviderFilters | null | undefined,
  answers: { id: string; answer: string }[],
): boolean {
  const chosen = cleanFilters(slug, filters).variants ?? [];
  const set = variantSet(slug);
  if (!set || chosen.length === 0) return true;
  const byId: Answers = new Map(answers.map((answer) => [answer.id, answer.answer]));
  return chosen.some((value) => set.matches(byId, value));
}
