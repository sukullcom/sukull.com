/**
 * Single source of truth for company / legal metadata shown across the
 * footer, legal pages, invoices and structured-data markup.
 *
 * ## How to fill in
 *
 * Every field marked `TBD` is a placeholder the business owner MUST
 * replace before going live in production. Leaving them blank is safer
 * than hard-coding guesses — the pages render the literal string so an
 * auditor (or the owner themselves) can grep for `TBD` and confirm
 * nothing slipped through. Environment variables override each field so
 * a deploy can swap values without a code change.
 *
 * ## Why a module and not JSON / env-only?
 *
 * Legal pages reference these across dozens of spots (KVKK adresi,
 * mesafeli satış tebligat, çerez iletişim vs.) and they're embedded in
 * JSON-LD for the organization schema. Centralising in TypeScript gives
 * us type safety, IDE navigation and compile-time "is this literal used
 * anywhere?" checks.
 *
 * IMPORTANT: do not import this from Client Components if the values
 * contain anything confidential. Today everything here is public (will
 * appear on a public page anyway), but treat the convention seriously.
 *
 * **KEP:** Her işletme için zorunlu değildir. `NEXT_PUBLIC_LEGAL_KEP_ADDRESS`
 * boş bırakılırsa yasal sayfalarda KEP satırı gösterilmez; iletişim e-posta ve
 * tebligat adresi üzerinden anlatılır. KEP aldığınızda env’e eklemeniz yeterlidir.
 */

function optionalPublicEnv(value: string | undefined): string | null {
  const t = value?.trim();
  return t && t.length > 0 ? t : null;
}

export const LEGAL_COMPANY = {
  /**
   * Ticari ünvan (ticaret sicil / şahıs şirketi unvanı).
   * Üretimde `NEXT_PUBLIC_LEGAL_COMPANY_NAME` ile güncelleyin.
   */
  legalName: process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME ?? "Numan Kaya",
  /** Marka adı — kullanıcıya görünen kısa ad. */
  brandName: "Sukull",
  /**
   * Şahıs işletme / şahıs şirketi işleteni (sözleşme ve “Hakkımızda” metinleri).
   * Genelde `legalName` ile aynıdır; farklı unvan kullanıyorsanız env ile ayırın.
   */
  proprietorName:
    process.env.NEXT_PUBLIC_LEGAL_PROPRIETOR_NAME ??
    process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME ??
    "Numan Kaya",
  /** MERSIS numarası (16 hane). */
  mersisNumber: process.env.NEXT_PUBLIC_LEGAL_MERSIS_NUMBER ?? "TBD – MERSIS",
  /** Vergi dairesi + vergi numarası. */
  taxOffice: process.env.NEXT_PUBLIC_LEGAL_TAX_OFFICE ?? "TBD – Vergi Dairesi",
  /** Vergi kimlik numarası (VKN). */
  taxNumber: process.env.NEXT_PUBLIC_LEGAL_TAX_NUMBER ?? "5331083815",
  /**
   * KEP (Kayıtlı Elektronik Posta) — varsa gösterilir; yoksa `null`.
   * `NEXT_PUBLIC_LEGAL_KEP_ADDRESS` (ör. `...@hs01.kep.tr`).
   */
  kepAddress: optionalPublicEnv(process.env.NEXT_PUBLIC_LEGAL_KEP_ADDRESS),
  /** Tescilli merkez adresi — Ticaret Sicil Gazetesi ile uyumlu. */
  address:
    process.env.NEXT_PUBLIC_LEGAL_ADDRESS ??
    "Cumhuriyet Mah. Açan Sk. Caner Apt No: 6-8 İç Kapı No: 10 Üsküdar / İstanbul",
  /** Müşteri iletişim e-postası (genel destek; KVKK ile aynı gelen kutuya yönlendirilebilir). */
  contactEmail: process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ?? "sukull.com@gmail.com",
  /** KVKK özel başvuru adresi (veri sorumlusu iletişimi). */
  kvkkEmail: process.env.NEXT_PUBLIC_LEGAL_KVKK_EMAIL ?? "sukull.com@gmail.com",
  /** Müşteri hizmetleri telefonu (opsiyonel). */
  phone: process.env.NEXT_PUBLIC_LEGAL_PHONE ?? null,
  /** Web sitesi kanonik URL. */
  websiteUrl: "https://sukull.com",
} as const;

/**
 * Son güncelleme tarihleri — her yasal metin bağımsız olarak güncellenir.
 * Tarih değiştiğinde sayfanın "Yürürlük Tarihi" satırı yeniden render edilir
 * ve sitemap `lastModified` alanı da bu tarihi yansıtır.
 */
export const LEGAL_UPDATED = {
  kvkk: "2026-05-08",
  gizlilik: "2026-04-06",
  cerez: "2026-04-06",
  kullanimSartlari: "2026-05-08",
  mesafeliSatis: "2026-05-08",
  onBilgilendirme: "2026-05-08",
  caymaIade: "2026-04-06",
  teslimatVeIade: "2026-05-08",
} as const;

export type LegalDocumentId = keyof typeof LEGAL_UPDATED;
