/**
 * GET  /api/private-lesson/listings
 *   Yalnızca onaylı eğitmenler açık talep ilanlarını listeler (branş/sınıf
 *   eşleşmesi `viewerTeacherId` ile). Öğrenci: 403.
 *   Query params: ?subject=&city=&lessonMode=&limit=&offset=
 *
 * POST /api/private-lesson/listings
 *   Students create a new demand post (talep ilanı). Rate-limited.
 *
 * The separate /listings/[id] route handles single-item reads and
 * student-owned edits / close. Teacher offers live under
 * /listings/[id]/offers.
 */
import { NextRequest, NextResponse } from "next/server";
import { getRequestLogger } from "@/lib/logger";
import { RATE_LIMITS } from "@/lib/rate-limit-db";
import { secureApi } from "@/lib/api-middleware";
import { verifyCsrf } from "@/lib/csrf";
import { isTrustedApiOrigin } from "@/lib/same-origin-api";
import { createListing, getOpenListings, isTeacher } from "@/db/queries";
import type { ListingLessonMode } from "@/db/queries/listings";
import {
  isValidTeachingGrade,
  isValidTeachingSubject,
} from "@/lib/teaching-offerings";
import {
  LISTING_DESCRIPTION_MIN_LEN,
  LISTING_PREFERRED_HOURS_MIN_LEN,
} from "@/lib/private-lesson-listings";
import { isValidTurkeyMobileForProfile } from "@/lib/teacher-profile-mutation";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const VALID_LESSON_MODES: ListingLessonMode[] = ["online", "in_person", "both"];

export const GET = secureApi.authRateLimited(
  {
    bucket: "listings-list",
    keyKind: "user",
    ...RATE_LIMITS.listingsRead,
  },
  async (request, user) => {
    try {
      if (!(await isTeacher(user.id))) {
        return NextResponse.json(
          {
            error:
              "Tüm talep ilanlarını yalnızca onaylı eğitmenler görüntüleyebilir.",
          },
          { status: 403 },
        );
      }

      const { searchParams } = new URL(request.url);
      const subject = searchParams.get("subject") ?? undefined;
      const city = searchParams.get("city") ?? undefined;
      const rawMode = searchParams.get("lessonMode");
      const lessonMode =
        rawMode && (VALID_LESSON_MODES as string[]).includes(rawMode)
          ? (rawMode as ListingLessonMode)
          : undefined;
      const limit = clampInt(searchParams.get("limit"), 1, 100, 20);
      const offset = clampInt(searchParams.get("offset"), 0, 10_000, 0);

      const rows = await getOpenListings({
        subject,
        city,
        lessonMode,
        limit,
        offset,
        viewerTeacherId: user.id,
      });

      return NextResponse.json({ listings: rows });
    } catch (error) {
      const log = await getRequestLogger({
        labels: { route: "api/private-lesson/listings", op: "list" },
      });
      log.error({
        message: "list listings failed",
        error,
        source: "api-route",
        location: "api/private-lesson/listings/GET",
      });
      return NextResponse.json({ error: "İlanlar alınamadı" }, { status: 500 });
    }
  },
);

export const POST = secureApi.authRateLimited(
  {
    bucket: "listings-create",
    keyKind: "user",
    ...RATE_LIMITS.listingWrite,
  },
  async (request: NextRequest, user) => {
    try {

    if (!isTrustedApiOrigin(request) || !verifyCsrf(request)) {
      return NextResponse.json(
        { error: "Geçersiz istek veya güvenlik doğrulaması başarısız." },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const subject = str(body.subject);
    const title = str(body.title);
    const description = str(body.description);
    const lessonMode = str(body.lessonMode);

    if (!subject || !title || !description || !lessonMode) {
      return NextResponse.json(
        { error: "Zorunlu alanlar eksik." },
        { status: 400 },
      );
    }
    if (description.length < LISTING_DESCRIPTION_MIN_LEN) {
      return NextResponse.json(
        {
          error: `Açıklama en az ${LISTING_DESCRIPTION_MIN_LEN} karakter olmalıdır.`,
        },
        { status: 400 },
      );
    }
    if (!(VALID_LESSON_MODES as string[]).includes(lessonMode)) {
      return NextResponse.json(
        { error: "Geçersiz ders tipi" },
        { status: 400 },
      );
    }
    if (!isValidTeachingSubject(subject)) {
      return NextResponse.json(
        { error: "Konu listeden seçilmelidir." },
        { status: 400 },
      );
    }
    const gradeRaw = str(body.grade);
    if (!gradeRaw || !isValidTeachingGrade(gradeRaw)) {
      return NextResponse.json(
        { error: "Sınıf / seviye listeden seçilmelidir." },
        { status: 400 },
      );
    }
    if (title.length > 120) {
      return NextResponse.json(
        { error: "Başlık en fazla 120 karakter olabilir" },
        { status: 400 },
      );
    }
    if (description.length > 2000) {
      return NextResponse.json(
        { error: "Açıklama en fazla 2000 karakter olabilir" },
        { status: 400 },
      );
    }

    const budgetMin = numOrNull(body.budgetMin);
    const budgetMax = numOrNull(body.budgetMax);
    if (budgetMin == null || budgetMax == null) {
      return NextResponse.json(
        {
          error:
            "Saatlik bütçe için hem minimum hem maksimum tutar (₺) girilmelidir.",
        },
        { status: 400 },
      );
    }
    if (budgetMin < 0 || budgetMax < 0) {
      return NextResponse.json(
        { error: "Bütçe negatif olamaz." },
        { status: 400 },
      );
    }
    if (budgetMin > budgetMax) {
      return NextResponse.json(
        { error: "Minimum bütçe maksimum bütçeden büyük olamaz." },
        { status: 400 },
      );
    }

    const preferredHours = str(body.preferredHours);
    if (preferredHours.length < LISTING_PREFERRED_HOURS_MIN_LEN) {
      return NextResponse.json(
        {
          error: `Tercih edilen saatler en az ${LISTING_PREFERRED_HOURS_MIN_LEN} karakter olmalıdır.`,
        },
        { status: 400 },
      );
    }

    const phoneRaw = str(body.contactPhone);
    if (!isValidTurkeyMobileForProfile(phoneRaw)) {
      return NextResponse.json(
        {
          error:
            "Geçerli bir Türkiye cep telefonu girilmelidir. Teklif veren eğitmenlerle paylaşılır.",
        },
        { status: 400 },
      );
    }
    const contactPhone = normalizeContactPhone(phoneRaw);
    if (!contactPhone) {
      return NextResponse.json(
        { error: "Telefon numarası işlenemedi. Lütfen kontrol edin." },
        { status: 400 },
      );
    }

    const cityTrim = str(body.city);
    const districtTrim = str(body.district);
    if (
      (lessonMode === "in_person" || lessonMode === "both") &&
      !cityTrim
    ) {
      return NextResponse.json(
        {
          error:
            "Yüz yüze veya karma ders seçildiğinde şehir alanı zorunludur.",
        },
        { status: 400 },
      );
    }

    const row = await createListing({
      studentId: user.id,
      subject,
      grade: gradeRaw,
      title,
      description,
      lessonMode: lessonMode as ListingLessonMode,
      city: cityTrim.length > 0 ? cityTrim : null,
      district: districtTrim.length > 0 ? districtTrim : null,
      budgetMin,
      budgetMax,
      preferredHours,
    });

    await db
      .update(users)
      .set({ phone: contactPhone, updated_at: new Date() })
      .where(eq(users.id, user.id));

    return NextResponse.json({ listing: row }, { status: 201 });
    } catch (error) {
      const log = await getRequestLogger({
        labels: { route: "api/private-lesson/listings", op: "create" },
      });
      log.error({
        message: "create listing failed",
        error,
        source: "api-route",
        location: "api/private-lesson/listings/POST",
      });
      return NextResponse.json(
        { error: "İlan oluşturulamadı" },
        { status: 500 },
      );
    }
  },
);

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function clampInt(
  raw: string | null,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/** Keeps + and digits; min length so random junk is not stored. */
function normalizeContactPhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const digits = v.replace(/[^\d+]/g, "").replace(/^\+{2,}/, "+");
  if (digits.length < 10 || digits.length > 20) return null;
  return digits;
}
