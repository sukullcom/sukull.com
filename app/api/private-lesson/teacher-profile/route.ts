import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getRequestLogger } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit-db";
import { secureApi } from "@/lib/api-middleware";
import {
  isTeacher,
  updateApprovedTeacherProfile,
  getTeacherApplicationByUserId,
} from "@/db/queries";
import {
  normalizeCapabilities,
  isValidTeachingSubject,
  isValidTeachingGrade,
} from "@/lib/teaching-offerings";
import { CACHE_TAGS } from "@/lib/cache-tags";

const VALID_LESSON_MODES = ["online", "in_person", "both"] as const;
type LessonMode = (typeof VALID_LESSON_MODES)[number];

export const GET = secureApi.authRateLimited(
  {
    bucket: "teacher-profile-read",
    keyKind: "user",
    ...RATE_LIMITS.read,
  },
  async (_request, user) => {
    try {
      if (!(await isTeacher(user.id))) {
        return NextResponse.json(
          { error: "Bu sayfa yalnızca eğitmenler içindir." },
          { status: 403 },
        );
      }

      const app = await getTeacherApplicationByUserId(user.id);
      if (!app || app.status !== "approved") {
        return NextResponse.json(
          { error: "Onaylı eğitmen kaydı bulunamadı." },
          { status: 404 },
        );
      }

      const caps = normalizeCapabilities(app.capabilitiesJson) ?? [];

      return NextResponse.json({
        application: {
          teacherName: app.teacherName ?? "",
          teacherSurname: app.teacherSurname ?? "",
          teacherPhoneNumber: app.teacherPhoneNumber ?? "",
          teacherEmail: app.teacherEmail ?? "",
          field: app.field,
          capabilities: caps,
          education: app.education ?? "",
          experienceYears: app.experienceYears ?? "",
          targetLevels: app.targetLevels ?? "",
          availableHours: app.availableHours ?? "",
          lessonMode: app.lessonMode ?? "",
          hourlyRateOnline:
            app.hourlyRateOnline != null ? String(app.hourlyRateOnline) : "",
          hourlyRateInPerson:
            app.hourlyRateInPerson != null ? String(app.hourlyRateInPerson) : "",
          city: app.city ?? "",
          district: app.district ?? "",
          bio: app.bio ?? "",
          status: app.status,
        },
      });
    } catch (error) {
      const log = await getRequestLogger({
        labels: { route: "api/private-lesson/teacher-profile", op: "GET" },
      });
      log.error({ message: "teacher profile GET failed", error, location: "teacher-profile/GET" });
      return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
  },
);

export const PATCH = secureApi.authRateLimited(
  {
    bucket: "teacher-profile-patch",
    keyKind: "user",
    ...RATE_LIMITS.teacherProfileWrite,
  },
  async (request: NextRequest, user) => {
    try {
      if (!(await isTeacher(user.id))) {
        return NextResponse.json(
          { error: "Bu işlem için eğitmen olman gerekir." },
          { status: 403 },
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
      const capabilities = normalizeCapabilities(body.capabilities);

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

      if (!teacherName || !teacherSurname || !teacherPhoneNumber || !teacherEmail) {
        return NextResponse.json(
          { error: "Ad, soyad, telefon ve e-posta zorunludur." },
          { status: 400 },
        );
      }

      const lessonMode = str(body.lessonMode);
      if (lessonMode && !(VALID_LESSON_MODES as readonly string[]).includes(lessonMode)) {
        return NextResponse.json({ error: "Geçersiz ders tipi" }, { status: 400 });
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

      await updateApprovedTeacherProfile(user.id, {
        teacherName,
        teacherSurname,
        teacherPhoneNumber,
        teacherEmail,
        field,
        capabilities,
        education: strOrNull(body.education),
        experienceYears: strOrNull(body.experienceYears),
        targetLevels: strOrNull(body.targetLevels),
        availableHours: strOrNull(body.availableHours),
        lessonMode: (lessonMode || null) as LessonMode | null,
        hourlyRateOnline,
        hourlyRateInPerson,
        city: strOrNull(body.city),
        district: strOrNull(body.district),
        bio: strOrNull(body.bio),
      });

      revalidateTag(CACHE_TAGS.teachers);
      revalidateTag(CACHE_TAGS.teacherStats(user.id));

      return NextResponse.json({ success: true, message: "Profilin güncellendi." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      if (msg.includes("Onaylı eğitmen kaydı bulunamadı")) {
        return NextResponse.json({ error: msg }, { status: 404 });
      }
      const log = await getRequestLogger({
        labels: { route: "api/private-lesson/teacher-profile", op: "PATCH" },
      });
      log.error({ message: "teacher profile PATCH failed", error: err, location: "teacher-profile/PATCH" });
      return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
    }
  },
);

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
  return Number.isFinite(n) ? Math.round(n) : null;
}
