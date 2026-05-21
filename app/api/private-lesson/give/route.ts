import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import db from "@/db/drizzle";
import { teacherApplications, schools } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import {
  normalizeCapabilities,
  isValidTeachingSubject,
  isValidTeachingGrade,
} from "@/lib/teaching-offerings";

const UNIVERSITY_MAX_LEN = 200;
const DEPARTMENT_MAX_LEN = 120;

/**
 * Üniversite adı `schools.name` (type=university) sözlüğünde var mı? Var ise
 * doğru "kanonik" yazımı döndür; yok ama serbest metne izin verilen sınır
 * içinde ise olduğu gibi kabul et (yurt dışı / yeni kurumlar için).
 */
async function resolveUniversityName(input: string): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.length > UNIVERSITY_MAX_LEN) return null;

  const row = await db
    .select({ name: schools.name })
    .from(schools)
    .where(
      sql`${schools.type} = 'university' AND lower(${schools.name}) = lower(${trimmed})`,
    )
    .limit(1);

  if (row[0]?.name) return row[0].name;
  // Listede yoksa olduğu gibi kabul et (allowFreeText senaryosu). 200 karakter
  // cap'i + sanitization (trim) ile XSS / payload abuse riskini sınırladık.
  return trimmed;
}

const VALID_LESSON_MODES = ["online", "in_person", "both"] as const;
type LessonMode = (typeof VALID_LESSON_MODES)[number];

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }

    // Light probe: this endpoint is polled from the teacher onboarding
    // flow and from the "Become a teacher" CTA on every page render.
    // Without a cap a navigation loop (or a client-side `setInterval`
    // that forgot to clear) can pin the pooler on a single user.
    // 60/min/user is ~10× the realistic call rate.
    const rl = await checkRateLimit({
      key: `applicationStatus:user:${user.id}`,
      ...RATE_LIMITS.lightProbe,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek. Biraz sonra tekrar deneyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const application = await db.query.teacherApplications.findFirst({
      where: (apps) => eq(apps.userId, user.id),
      orderBy: (apps) => [desc(apps.createdAt)],
    });

    if (!application) {
      return NextResponse.json({ hasApplication: false });
    }

    return NextResponse.json({
      hasApplication: true,
      status: application.status,
      field: application.field,
      createdAt: application.createdAt,
    });
  } catch (error) {
    {
      const log = await getRequestLogger({ labels: { route: "api/private-lesson/give", op: "status" } });
      log.error({ message: "teacher app status failed", error, location: "api/private-lesson/give/GET" });
    }
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
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
      key: `applicationSubmit:user:${user.id}`,
      ...RATE_LIMITS.applicationSubmit,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık başvuru gönderiyorsunuz. Biraz sonra tekrar deneyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const teacherName = str(body.teacherName);
    const teacherSurname = str(body.teacherSurname);
    const teacherPhoneNumber = str(body.teacherPhoneNumber);
    const teacherEmail = str(body.teacherEmail);
    const field = str(body.field);
    const capsRaw = body.capabilities;
    const capabilities = normalizeCapabilities(capsRaw);
    if (!capabilities || capabilities.length === 0) {
      return NextResponse.json(
        { error: "En az bir ders ve sınıf çifti seçmelisin." },
        { status: 400 },
      );
    }
    if (!field || !isValidTeachingSubject(field)) {
      return NextResponse.json({ error: "Geçersiz ders alanı" }, { status: 400 });
    }
    if (capabilities[0].subject !== field) {
      return NextResponse.json(
        { error: "Birincil ders alanı ile seçimler uyuşmuyor." },
        { status: 400 },
      );
    }
    for (const c of capabilities) {
      if (!isValidTeachingSubject(c.subject) || !isValidTeachingGrade(c.grade)) {
        return NextResponse.json(
          { error: "Geçersiz ders veya sınıf seçimi" },
          { status: 400 },
        );
      }
    }

    if (
      !teacherName ||
      !teacherSurname ||
      !teacherPhoneNumber ||
      !teacherEmail ||
      !field
    ) {
      return NextResponse.json(
        { error: "Lütfen tüm gerekli alanları doldurun" },
        { status: 400 },
      );
    }

    const lessonMode = str(body.lessonMode);
    if (lessonMode && !(VALID_LESSON_MODES as readonly string[]).includes(lessonMode)) {
      return NextResponse.json(
        { error: "Geçersiz ders tipi" },
        { status: 400 },
      );
    }

    const hourlyRateOnline = numOrNull(body.hourlyRateOnline);
    const hourlyRateInPerson = numOrNull(body.hourlyRateInPerson);
    if (
      hourlyRateOnline != null &&
      (hourlyRateOnline < 0 || hourlyRateOnline > 100_000)
    ) {
      return NextResponse.json(
        { error: "Online saatlik ücret geçersiz" },
        { status: 400 },
      );
    }
    if (
      hourlyRateInPerson != null &&
      (hourlyRateInPerson < 0 || hourlyRateInPerson > 100_000)
    ) {
      return NextResponse.json(
        { error: "Yüz yüze saatlik ücret geçersiz" },
        { status: 400 },
      );
    }

    const rawUniversity = str(body.university);
    const rawDepartment = str(body.universityDepartment);
    if (rawUniversity.length > UNIVERSITY_MAX_LEN) {
      return NextResponse.json(
        { error: "Üniversite adı çok uzun" },
        { status: 400 },
      );
    }
    if (rawDepartment.length > DEPARTMENT_MAX_LEN) {
      return NextResponse.json(
        { error: "Bölüm adı çok uzun" },
        { status: 400 },
      );
    }
    const universityResolved = rawUniversity
      ? await resolveUniversityName(rawUniversity)
      : null;

    const existingApplication = await db.query.teacherApplications.findFirst({
      where: (teacherApplications, { eq }) =>
        eq(teacherApplications.userId, user.id),
    });

    if (existingApplication) {
      if (existingApplication.status === "pending") {
        return NextResponse.json(
          {
            error:
              "Başvurunuz zaten inceleme sürecindedir. Lütfen sonucu bekleyin.",
          },
          { status: 400 },
        );
      }
      if (existingApplication.status === "approved") {
        return NextResponse.json(
          { error: "Zaten onaylı bir eğitmen kaydın var." },
          { status: 400 },
        );
      }
      // Rejected: clear the old row so the user can re-apply in place.
      await db
        .delete(teacherApplications)
        .where(eq(teacherApplications.userId, user.id));
    }

    const application = await db
      .insert(teacherApplications)
      .values({
        userId: user.id,
        field,
        quizResult: 0,
        passed: true,
        teacherName,
        teacherSurname,
        teacherPhoneNumber,
        teacherEmail,
        education: strOrNull(body.education),
        university: universityResolved,
        universityDepartment: rawDepartment.length > 0 ? rawDepartment : null,
        experienceYears: strOrNull(body.experienceYears),
        targetLevels: strOrNull(body.targetLevels),
        availableHours: strOrNull(body.availableHours),
        lessonMode: (lessonMode || null) as LessonMode | null,
        hourlyRate: null,
        hourlyRateOnline,
        hourlyRateInPerson,
        city: strOrNull(body.city),
        district: strOrNull(body.district),
        bio: strOrNull(body.bio),
        classification: "pending",
        status: "pending",
        capabilitiesJson: capabilities,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        message: "Eğitmen başvurunuz başarıyla gönderildi",
        application: application[0],
      },
      { status: 201 },
    );
  } catch (error) {
    const log = await getRequestLogger({
      labels: { route: "api/private-lesson/give", op: "submit" },
    });
    log.error({
      message: "submit teacher app failed",
      error,
      location: "api/private-lesson/give/POST",
    });
    return NextResponse.json(
      { error: "Başvurunuz gönderilirken bir hata oluştu" },
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
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}
