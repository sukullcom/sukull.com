/**
 * GET  /api/private-lesson/listings
 *   Public-ish: any authenticated user can browse open listings.
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
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import { createListing, getOpenListings } from "@/db/queries";
import type { ListingLessonMode } from "@/db/queries/listings";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const VALID_LESSON_MODES: ListingLessonMode[] = ["online", "in_person", "both"];

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 },
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
    });

    return NextResponse.json({ listings: rows });
  } catch (error) {
    const log = await getRequestLogger({
      labels: { route: "api/private-lesson/listings", op: "list" },
    });
    log.error({
      message: "list listings failed",
      error,
      location: "api/private-lesson/listings/GET",
    });
    return NextResponse.json({ error: "İlanlar alınamadı" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 },
      );
    }

    const rl = await checkRateLimit({
      key: `listingWrite:user:${user.id}`,
      ...RATE_LIMITS.listingWrite,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık ilan oluşturuyorsunuz. Biraz sonra tekrar deneyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
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
        { error: "Zorunlu alanlar eksik" },
        { status: 400 },
      );
    }
    if (!(VALID_LESSON_MODES as string[]).includes(lessonMode)) {
      return NextResponse.json(
        { error: "Geçersiz ders tipi" },
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
    if (
      budgetMin != null &&
      budgetMax != null &&
      budgetMin > budgetMax
    ) {
      return NextResponse.json(
        { error: "Minimum bütçe maksimum bütçeden büyük olamaz" },
        { status: 400 },
      );
    }

    const row = await createListing({
      studentId: user.id,
      subject,
      grade: strOrNull(body.grade),
      title,
      description,
      lessonMode: lessonMode as ListingLessonMode,
      city: strOrNull(body.city),
      district: strOrNull(body.district),
      budgetMin,
      budgetMax,
      preferredHours: strOrNull(body.preferredHours),
    });

    const contactPhone = normalizeContactPhone(body.contactPhone);
    if (contactPhone) {
      await db
        .update(users)
        .set({ phone: contactPhone, updated_at: new Date() })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({ listing: row }, { status: 201 });
  } catch (error) {
    const log = await getRequestLogger({
      labels: { route: "api/private-lesson/listings", op: "create" },
    });
    log.error({
      message: "create listing failed",
      error,
      location: "api/private-lesson/listings/POST",
    });
    return NextResponse.json(
      { error: "İlan oluşturulamadı" },
      { status: 500 },
    );
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function strOrNull(v: unknown): string | null {
  const s = str(v);
  return s.length > 0 ? s : null;
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
