import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import db from "@/db/drizzle";
import { teacherApplications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
          { error: "Zaten onaylanmış bir eğitmen hesabınız bulunmaktadır." },
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
