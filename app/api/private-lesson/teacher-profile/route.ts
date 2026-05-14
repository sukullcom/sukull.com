import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getRequestLogger } from "@/lib/logger";
import { RATE_LIMITS } from "@/lib/rate-limit-db";
import { secureApi } from "@/lib/api-middleware";
import {
  isTeacher,
  updateApprovedTeacherProfile,
  getTeacherApplicationByUserId,
} from "@/db/queries";
import {
  normalizeCapabilities,
} from "@/lib/teaching-offerings";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { isTrustedApiOrigin } from "@/lib/same-origin-api";
import { verifyCsrf } from "@/lib/csrf";
import {
  assertTeacherProfileBodySize,
  isValidTurkeyMobileForProfile,
  sanitizeTeacherProfilePlainText,
  validateCapabilitiesMatchPrimaryField,
} from "@/lib/teacher-profile-mutation";

const VALID_LESSON_MODES = ["online", "in_person", "both"] as const;
type LessonMode = (typeof VALID_LESSON_MODES)[number];

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private, max-age=0",
} as const;

const MAX_NAME = 80;
// UI ile uyumlu (1000 karakter). Önceki 8000 çok cömerdi — DB şişme ve
// "küçük öğretmen kartında devasa metin" UX'i için sınırlı.
const MAX_BIO = 1000;
const MAX_MISC = 500;

export const GET = secureApi.authRateLimited(
  {
    bucket: "teacher-profile-read",
    keyKind: "user",
    ...RATE_LIMITS.teacherProfileRead,
  },
  async (request: NextRequest, user) => {
    try {
      const origin = request.headers.get("origin");
      if (origin && !isTrustedApiOrigin(request)) {
        return NextResponse.json(
          { error: "Geçersiz istek kaynağı." },
          { status: 403 },
        );
      }

      if (!(await isTeacher(user.id))) {
        return NextResponse.json(
          { error: "Bu sayfa yalnızca eğitmenler içindir." },
          { status: 403 },
        );
      }

      const app = await getTeacherApplicationByUserId(user.id);
      if (!app || app.status !== "approved") {
        return NextResponse.json(
          { error: "Kayıt bulunamadı." },
          { status: 404, headers: NO_STORE_HEADERS },
        );
      }

      const caps = normalizeCapabilities(app.capabilitiesJson) ?? [];

      return NextResponse.json(
        {
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
        },
        { headers: NO_STORE_HEADERS },
      );
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
      if (!isTrustedApiOrigin(request)) {
        return NextResponse.json({ error: "Geçersiz istek kaynağı" }, { status: 403 });
      }
      if (!verifyCsrf(request)) {
        return NextResponse.json(
          { error: "Geçersiz veya eksik güvenlik doğrulaması. Sayfayı yenileyip tekrar dene." },
          { status: 403 },
        );
      }
      if (!(await isTeacher(user.id))) {
        return NextResponse.json(
          { error: "Bu işlem için eğitmen olman gerekir." },
          { status: 403 },
        );
      }

      try {
        assertTeacherProfileBodySize(request);
      } catch {
        return NextResponse.json(
          { error: "İstek gövdesi çok büyük." },
          { status: 413 },
        );
      }

      const body = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      const teacherName = sanitizeTeacherProfilePlainText(
        str(body.teacherName),
        MAX_NAME,
      );
      const teacherSurname = sanitizeTeacherProfilePlainText(
        str(body.teacherSurname),
        MAX_NAME,
      );
      const teacherPhoneNumber = str(body.teacherPhoneNumber);
      const teacherEmail = str(body.teacherEmail).toLowerCase();
      const capabilities = normalizeCapabilities(body.capabilities);

      if (!capabilities || capabilities.length === 0) {
        return NextResponse.json(
          { error: "En az bir ders ve sınıf çifti seçmelisin." },
          { status: 400 },
        );
      }
      /** Birincil branş her zaman ilk satır; gövdedeki `field` ile çelişkiyi önle. */
      const field = capabilities[0].subject;
      if (!validateCapabilitiesMatchPrimaryField(field, capabilities)) {
        return NextResponse.json(
          { error: "Ders ve sınıf seçimleri geçersiz veya tutarsız." },
          { status: 400 },
        );
      }

      if (!teacherName || !teacherSurname || !teacherPhoneNumber || !teacherEmail) {
        return NextResponse.json(
          { error: "Ad, soyad, telefon ve e-posta zorunludur." },
          { status: 400 },
        );
      }

      if (!isValidTurkeyMobileForProfile(teacherPhoneNumber)) {
        return NextResponse.json(
          { error: "Geçerli bir Türkiye cep telefonu girin." },
          { status: 400 },
        );
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacherEmail) || teacherEmail.length > 120) {
        return NextResponse.json(
          { error: "Geçerli bir e-posta adresi girin." },
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
        education: optSan(body.education, MAX_MISC),
        experienceYears: optSan(body.experienceYears, MAX_MISC),
        targetLevels: optSan(body.targetLevels, MAX_MISC),
        availableHours: optSan(body.availableHours, MAX_MISC),
        lessonMode: (lessonMode || null) as LessonMode | null,
        hourlyRateOnline,
        hourlyRateInPerson,
        city: optSan(body.city, MAX_MISC),
        district: optSan(body.district, MAX_MISC),
        bio: optSan(body.bio, MAX_BIO),
      });

      revalidateTag(CACHE_TAGS.teachers);
      revalidateTag(CACHE_TAGS.teacherStats(user.id));

      const logOk = await getRequestLogger({
        labels: { route: "api/private-lesson/teacher-profile", op: "PATCH" },
      });
      logOk.info("teacher profile self-updated", {
        userId: user.id,
        patchedKeys: Object.keys(body).filter((k) => body[k] !== undefined),
      });

      return NextResponse.json(
        { success: true, message: "Profilin güncellendi." },
        { headers: NO_STORE_HEADERS },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.includes("Onaylı eğitmen kaydı bulunamadı") ||
        msg.includes("Eğitmen kaydı güncellenemedi")
      ) {
        return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
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
function optSan(v: unknown, maxLen: number): string | null {
  const s = str(v);
  if (!s) return null;
  return sanitizeTeacherProfilePlainText(s, maxLen);
}
function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}
