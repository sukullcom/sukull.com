import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getRequestLogger } from "@/lib/logger";
import { RATE_LIMITS } from "@/lib/rate-limit-db";
import { secureApi } from "@/lib/api-middleware";
import { isTeacher, leaveTeacherProgram } from "@/db/queries";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { isTrustedApiOrigin } from "@/lib/same-origin-api";
import { verifyCsrf } from "@/lib/csrf";

export const POST = secureApi.authRateLimited(
  {
    bucket: "teacher-leave",
    keyKind: "user",
    ...RATE_LIMITS.teacherLeave,
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
          { error: "Aktif eğitmen kaydı bulunamadı." },
          { status: 403 },
        );
      }

      const body = (await request.json().catch(() => ({}))) as {
        confirm?: unknown;
      };
      if (body.confirm !== true) {
        return NextResponse.json(
          { error: "Onay için confirm: true gönderilmelidir." },
          { status: 400 },
        );
      }

      await leaveTeacherProgram(user.id);

      revalidateTag(CACHE_TAGS.teachers);
      revalidateTag(CACHE_TAGS.teacherStats(user.id));

      return NextResponse.json({
        success: true,
        message: "Öğretmenlik kaydın kaldırıldı.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      if (msg.includes("Yönetici hesapları")) {
        return NextResponse.json({ error: msg }, { status: 403 });
      }
      const log = await getRequestLogger({
        labels: { route: "api/private-lesson/teacher-profile/leave", op: "POST" },
      });
      log.error({
        message: "teacher leave failed",
        error: err,
        location: "teacher-profile/leave",
      });
      return NextResponse.json({ error: "İşlem tamamlanamadı" }, { status: 500 });
    }
  },
);
