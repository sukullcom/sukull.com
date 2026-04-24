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
 */

export const LEGAL_COMPANY = {
  /** Ticari ünvan — "AAA Eğitim Teknolojileri A.Ş." gibi. */
  legalName: process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME ?? "TBD – Şirket Unvanı",
  /** Marka adı — kullanıcıya görünen kısa ad. */
  brandName: "Sukull",
  /** MERSIS numarası (16 hane). */
  mersisNumber: process.env.NEXT_PUBLIC_LEGAL_MERSIS_NUMBER ?? "TBD – MERSIS",
  /** Vergi dairesi + vergi numarası. */
  taxOffice: process.env.NEXT_PUBLIC_LEGAL_TAX_OFFICE ?? "TBD – Vergi Dairesi",
  taxNumber: process.env.NEXT_PUBLIC_LEGAL_TAX_NUMBER ?? "TBD – Vergi No",
  /** KEP (Kayıtlı Elektronik Posta) adresi — tebligat için zorunlu. */
  kepAddress: process.env.NEXT_PUBLIC_LEGAL_KEP_ADDRESS ?? "TBD – KEP Adresi",
  /** Tescilli merkez adresi — Ticaret Sicil Gazetesi ile uyumlu. */
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "TBD – Şirket Adresi",
  /** Müşteri iletişim e-postası (KVKK başvuruları ve genel destek). */
  contactEmail: process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ?? "destek@sukull.com",
  /** KVKK özel başvuru adresi (veri sorumlusu iletişimi). */
  kvkkEmail: process.env.NEXT_PUBLIC_LEGAL_KVKK_EMAIL ?? "kvkk@sukull.com",
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
  kvkk: "2026-04-06",
  gizlilik: "2026-04-06",
  cerez: "2026-04-06",
  kullanimSartlari: "2026-04-06",
  mesafeliSatis: "2026-04-06",
  onBilgilendirme: "2026-04-06",
  caymaIade: "2026-04-06",
} as const;

export type LegalDocumentId = keyof typeof LEGAL_UPDATED;
