/**
 * Admin → schools master data CRUD (şimdilik sadece "add").
 *
 *  GET  /api/admin/schools?q=<arama>&city=<UPPER>
 *    İsim ILIKE araması; opsiyonel city ile daraltma. Form içindeki
 *    "önce var mı?" panelini besler — duplicate'i admin'in gözüne sokar.
 *
 *  POST /api/admin/schools
 *    Body: { name, city, district, type, kind? }
 *    - `type` ∈ {university, high_school, secondary_school, elementary_school}
 *    - `category` server tarafında `type`'tan türetilir (1:1 invariant)
 *    - city / district `school-data-normalize.ts` üzerinden upper Türkçeye
 *      çevrilir (BAGCILAR → BAĞCILAR vb.)
 *    - Duplicate (aynı upper-name + city + district + type) → 409
 *    - Başarılı insert: `revalidateTag(CACHE_TAGS.schoolsMaster)` ile
 *      şehir/ilçe/kategori aggregate cache'i bust edilir; onboarding
 *      dropdown'ları sonraki istekte yeni okulu görür.
 *
 * Güvenlik tabakaları (kredi route'uyla aynı sözleşme):
 *   - Auth + `isAdmin()` (DB role + env e-posta listesi)
 *   - Same-origin + CSRF (double submit)
 *   - Per-admin rate limit (`adminSchoolWrite`, `adminSchoolSearch`)
 *   - Aynı işlem `admin_audit`'a yazılır (`school.create`)
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { getAdminActor } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";
import { verifyCsrf } from "@/lib/csrf";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import { isTrustedApiOrigin } from "@/lib/same-origin-api";
import {
  createSchoolFromAdminInput,
  isValidSchoolType,
  searchSchoolsForAdmin,
  type SchoolTypeValue,
} from "@/db/queries/admin-schools";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

export async function GET(request: NextRequest) {
  const log = await getRequestLogger({
    labels: { route: "api/admin/schools", op: "search" },
  });

  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 401 },
      );
    }

    const rl = await checkRateLimit({
      key: `adminSchoolSearch:user:${actor.id}`,
      ...RATE_LIMITS.adminSchoolSearch,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const cityParam = (searchParams.get("city") ?? "").trim();

    if (q.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ schools: [] });
    }
    if (q.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: "Arama metni çok uzun." },
        { status: 400 },
      );
    }

    const rows = await searchSchoolsForAdmin({
      q,
      cityUpper: cityParam ? cityParam.toLocaleUpperCase("tr-TR") : undefined,
    });
    return NextResponse.json({ schools: rows });
  } catch (error) {
    log.error({
      message: "admin schools search failed",
      error,
      location: "api/admin/schools/GET",
    });
    return NextResponse.json(
      { error: "Arama başarısız." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const log = await getRequestLogger({
    labels: { route: "api/admin/schools", op: "create" },
  });

  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 401 },
      );
    }

    if (!isTrustedApiOrigin(request) || !verifyCsrf(request)) {
      return NextResponse.json(
        { error: "Geçersiz istek veya güvenlik doğrulaması başarısız." },
        { status: 403 },
      );
    }

    const rl = await checkRateLimit({
      key: `adminSchoolWrite:user:${actor.id}`,
      ...RATE_LIMITS.adminSchoolWrite,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const name = typeof body.name === "string" ? body.name : "";
    const city = typeof body.city === "string" ? body.city : "";
    const district = typeof body.district === "string" ? body.district : "";
    const kind =
      typeof body.kind === "string" && body.kind.trim() !== ""
        ? body.kind
        : null;
    const typeRaw = body.type;

    if (!isValidSchoolType(typeRaw)) {
      return NextResponse.json(
        {
          error:
            "Geçersiz okul tipi. (university / high_school / secondary_school / elementary_school)",
        },
        { status: 400 },
      );
    }
    const type: SchoolTypeValue = typeRaw;

    const result = await createSchoolFromAdminInput({
      name,
      city,
      district,
      type,
      kind,
    });

    if (!result.ok) {
      if (result.reason === "duplicate") {
        return NextResponse.json(
          {
            error:
              "Bu okul zaten kayıtlı görünüyor. Aynı isim/il/ilçe/tip ile eşleşen kayıt var.",
            existing: result.existing,
          },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Okul aggregation'larını (cities / districts / categories / universities)
    // anında tazele; onboarding'daki dropdown'lar bir sonraki istekte yeni
    // okulu görsün. Per-(il,ilçe,kategori) okul listesi browser/CDN'de 120 s
    // SWR ile cache'li — bilinçli olarak bust etmiyoruz, en geç 2 dakikada
    // doğal şekilde tazelenir; admin bu süre içinde duplicate eklemesin diye
    // form sonrası "son eklenenler" panelinde gösteriyoruz.
    try {
      revalidateTag(CACHE_TAGS.schoolsMaster);
    } catch (tagErr) {
      log.warn("revalidateTag failed (non-fatal)", {
        location: "api/admin/schools/POST/revalidateTag",
        error:
          tagErr instanceof Error
            ? { name: tagErr.name, message: tagErr.message }
            : { raw: String(tagErr) },
      });
    }

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "school.create",
      targetType: "school",
      targetId: result.school.id,
      metadata: {
        name: result.school.name,
        city: result.school.city,
        district: result.school.district,
        category: result.school.category,
        type: result.school.type,
        kind: result.school.kind,
      },
    });

    return NextResponse.json({ ok: true, school: result.school });
  } catch (error) {
    log.error({
      message: "admin schools create failed",
      error,
      location: "api/admin/schools/POST",
    });
    return NextResponse.json(
      { error: "İşlem başarısız." },
      { status: 500 },
    );
  }
}
