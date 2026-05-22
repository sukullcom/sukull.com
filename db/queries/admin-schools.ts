/**
 * Admin → schools master data helpers.
 *
 * Bu modül yalnızca admin yazma / arama yolundan kullanılır. Public okuma
 * yolu (`getSchools`, `/api/schools?action=...`) `./schools.ts` ve API
 * route'larındaki `unstable_cache` katmanları üzerinden gider; burası
 * cache'lenmemiş canlı sorgular yapar çünkü:
 *
 *   - Admin tarafı duplicate kontrolü için anlık veri görmek zorunda
 *     (eklenir eklenmez sonuçta görünmesin gerekiyor).
 *   - INSERT tarafı transactional olduğu için cache layer'a gerek yok;
 *     INSERT sonrası `revalidateTag(CACHE_TAGS.schoolsMaster)` ile public
 *     katalog cache'i tek noktada bust edilir.
 */
import "server-only";

import { and, asc, eq, ilike, sql } from "drizzle-orm";

import db from "@/db/drizzle";
import { schools } from "@/db/schema";
import { logger } from "@/lib/logger";
import {
  fixUniversityCity,
  normalizeDistrictName,
  normalizeUniversityDistrict,
} from "@/lib/school-data-normalize";

const log = logger.child({ labels: { module: "db/queries/admin-schools" } });

export type SchoolTypeValue =
  | "university"
  | "high_school"
  | "secondary_school"
  | "elementary_school";

export type SchoolCategoryValue =
  | "University"
  | "High School"
  | "Secondary School"
  | "Primary School";

/**
 * `schools.type` ↔ `schools.category` 1:1 eşlemesi. Schema'da iki kolon ayrı
 * olduğu için tutarlılığı uygulama katmanı garanti eder; admin formu sadece
 * `type`'ı sorar, server `category`'yi otomatik türetir.
 *
 * Dikkat: `elementary_school` → "Primary School" (CSV import sözleşmesi).
 */
const SCHOOL_TYPE_TO_CATEGORY: Record<SchoolTypeValue, SchoolCategoryValue> = {
  university: "University",
  high_school: "High School",
  secondary_school: "Secondary School",
  elementary_school: "Primary School",
};

export function categoryFromType(type: SchoolTypeValue): SchoolCategoryValue {
  return SCHOOL_TYPE_TO_CATEGORY[type];
}

export function isValidSchoolType(value: unknown): value is SchoolTypeValue {
  return (
    value === "university" ||
    value === "high_school" ||
    value === "secondary_school" ||
    value === "elementary_school"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search (duplicate-check + admin lookup)
// ─────────────────────────────────────────────────────────────────────────────

export type AdminSchoolSearchRow = {
  id: number;
  name: string;
  city: string;
  district: string;
  category: string;
  kind: string | null;
  type: SchoolTypeValue;
};

export type AdminSchoolSearchInput = {
  /** Free-text — ad üzerinden ILIKE %q%. >=2 karakter zorunlu (üst katman uygular). */
  q: string;
  /** Aday il (zaten normalize edilmiş upper Türkçe). Daraltma için opsiyonel. */
  cityUpper?: string;
  limit?: number;
};

const SEARCH_HARD_CAP = 20;

/**
 * Admin duplicate-kontrol / hızlı bakış araması. Public katalog endpoint'leri
 * şehir + ilçe + kategori zorunlu kıldığı için "sadece isimle ara" senaryosu
 * burada karşılanır.
 *
 * `idx_schools_name_trgm` (pg_trgm) genelde ILIKE'ı kapsar; aksi halde
 * `idx_schools_name_ilike` btree pattern fallback olur. Cap = 20 satır.
 */
export async function searchSchoolsForAdmin(
  input: AdminSchoolSearchInput,
): Promise<AdminSchoolSearchRow[]> {
  const q = input.q.trim();
  if (q.length < 2) return [];

  const limit = Math.max(1, Math.min(SEARCH_HARD_CAP, input.limit ?? SEARCH_HARD_CAP));

  const conditions = [ilike(schools.name, `%${escapeIlike(q)}%`)];
  if (input.cityUpper) {
    conditions.push(eq(schools.city, input.cityUpper));
  }

  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      city: schools.city,
      district: schools.district,
      category: schools.category,
      kind: schools.kind,
      type: schools.type,
    })
    .from(schools)
    .where(and(...conditions))
    .orderBy(
      sql`CASE
        WHEN LOWER(${schools.name}) = LOWER(${q}) THEN 1
        WHEN LOWER(${schools.name}) LIKE LOWER(${q} || '%') THEN 2
        ELSE 3
      END`,
      asc(schools.name),
    )
    .limit(limit);

  return rows.map((r) => ({ ...r, type: r.type as SchoolTypeValue }));
}

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────────────

export type CreateSchoolInput = {
  /** Ham giriş — server normalize eder. */
  name: string;
  city: string;
  district: string;
  type: SchoolTypeValue;
  /** Opsiyonel alt-tür (örn. "Anadolu Lisesi", "İmam Hatip"). */
  kind?: string | null;
};

export type CreateSchoolNormalized = {
  name: string;
  city: string;
  district: string;
  type: SchoolTypeValue;
  category: SchoolCategoryValue;
  kind: string | null;
};

export type CreateSchoolResult =
  | { ok: true; school: AdminSchoolSearchRow }
  | { ok: false; reason: "duplicate"; existing: AdminSchoolSearchRow }
  | { ok: false; reason: "validation"; message: string };

const MAX_NAME = 200;
const MIN_NAME = 3;
const MAX_KIND = 100;
const MAX_FIELD = 80;

/**
 * Form girdisini DB'ye yazılacak şekle döker:
 *   - name: trim + tek-boşluğa daralt
 *   - city: schools tablosunda zaten upper Türkçe olarak tutulduğu için
 *     `fixUniversityCity` + uppercase + trim
 *   - district: `normalizeDistrictName` (overrides) + üniversite ise
 *     `normalizeUniversityDistrict("Kampüs")`
 *   - category: type'tan türetilir (tutarlılık invariant'ı)
 */
export function normalizeCreateSchoolInput(
  input: CreateSchoolInput,
): CreateSchoolNormalized | { error: string } {
  const name = (input.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < MIN_NAME) {
    return { error: `Okul adı en az ${MIN_NAME} karakter olmalı.` };
  }
  if (name.length > MAX_NAME) {
    return { error: `Okul adı en fazla ${MAX_NAME} karakter olabilir.` };
  }

  if (!isValidSchoolType(input.type)) {
    return { error: "Geçersiz okul tipi." };
  }
  const category = categoryFromType(input.type);

  const cityRaw = (input.city ?? "").trim();
  if (!cityRaw) return { error: "İl bilgisi zorunlu." };
  if (cityRaw.length > MAX_FIELD) return { error: "İl adı çok uzun." };
  const cityUpper = fixUniversityCity(cityRaw, name, category);
  if (!cityUpper) return { error: "İl bilgisi normalize edilemedi." };

  const districtRaw = (input.district ?? "").trim();
  if (!districtRaw) return { error: "İlçe bilgisi zorunlu." };
  if (districtRaw.length > MAX_FIELD) return { error: "İlçe adı çok uzun." };
  const districtNorm = normalizeUniversityDistrict(
    normalizeDistrictName(districtRaw, cityUpper),
    category,
  );

  const kindRaw = (input.kind ?? "").trim();
  if (kindRaw.length > MAX_KIND) {
    return { error: "Alt tür (kind) çok uzun." };
  }
  const kind = kindRaw.length > 0 ? kindRaw : null;

  return {
    name,
    city: cityUpper,
    district: districtNorm,
    type: input.type,
    category,
    kind,
  };
}

/**
 * Aynı ad + il + ilçe + tip kombinasyonu zaten varsa duplicate sayar.
 * `kind` farklılığı duplicate'i bozmaz — örn. "X Anadolu Lisesi" / "X Lisesi"
 * gibi yazım farkları admin'in dikkatine sunulur (UI search panel) ve yine
 * de eklemeyi seçerse eklenir; ancak birebir aynı kayıt iki kez girilemez.
 */
async function findExistingSchool(
  n: CreateSchoolNormalized,
): Promise<AdminSchoolSearchRow | null> {
  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      city: schools.city,
      district: schools.district,
      category: schools.category,
      kind: schools.kind,
      type: schools.type,
    })
    .from(schools)
    .where(
      and(
        eq(schools.city, n.city),
        eq(schools.district, n.district),
        eq(schools.type, n.type),
        ilike(schools.name, n.name),
      ),
    )
    .limit(1);

  const row = rows[0];
  return row ? { ...row, type: row.type as SchoolTypeValue } : null;
}

export async function createSchoolFromAdminInput(
  input: CreateSchoolInput,
): Promise<CreateSchoolResult> {
  const normalized = normalizeCreateSchoolInput(input);
  if ("error" in normalized) {
    return { ok: false, reason: "validation", message: normalized.error };
  }

  const existing = await findExistingSchool(normalized);
  if (existing) {
    return { ok: false, reason: "duplicate", existing };
  }

  try {
    const [inserted] = await db
      .insert(schools)
      .values({
        name: normalized.name,
        city: normalized.city,
        district: normalized.district,
        category: normalized.category,
        type: normalized.type,
        kind: normalized.kind,
        // totalPoints / activeStudentCount / *AvgPoints alanları default 0.
        // Liderlik cron'u (`recompute-school-points`) öğrenci puanları
        // birikince güncelliyor.
      })
      .returning({
        id: schools.id,
        name: schools.name,
        city: schools.city,
        district: schools.district,
        category: schools.category,
        kind: schools.kind,
        type: schools.type,
      });

    if (!inserted) {
      return {
        ok: false,
        reason: "validation",
        message: "Okul eklenemedi (boş insert sonucu).",
      };
    }

    return {
      ok: true,
      school: { ...inserted, type: inserted.type as SchoolTypeValue },
    };
  } catch (err) {
    log.error({
      message: "admin school insert failed",
      error: err,
      location: "db/queries/admin-schools/createSchoolFromAdminInput",
      fields: {
        type: normalized.type,
        city: normalized.city,
        district: normalized.district,
      },
    });
    return {
      ok: false,
      reason: "validation",
      message: "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.",
    };
  }
}
