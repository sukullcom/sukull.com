import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { lessonBookings } from "@/db/schema";
import { eq, lt, and, isNotNull, isNull } from "drizzle-orm";
import { LESSON_CONFIG } from "@/lib/lesson-config";
import { getServerUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCron) {
      const user = await getServerUser();
      if (!user) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
      }
    }
    const now = new Date();
    let totalUpdated = 0;
    const results = [];

    // 1. pending → confirmed: Ders başlangıç saati gelmiş
    const confirmedResult = await db
      .update(lessonBookings)
      .set({ status: "confirmed", updatedAt: now })
      .where(and(
        eq(lessonBookings.status, "pending"),
        lt(lessonBookings.startTime, now)
      ))
      .returning();

    if (confirmedResult.length > 0) {
      totalUpdated += confirmedResult.length;
      results.push({ action: "confirmed", count: confirmedResult.length });
    }

    // 2. confirmed → completed (öğretmen katıldı): Ders bitmiş VE öğretmen katılmış → kazanç yaz
    const completedWithEarnings = await db
      .update(lessonBookings)
      .set({
        status: "completed",
        completedAt: now,
        earningsAmount: LESSON_CONFIG.TEACHER_EARNINGS_PER_LESSON,
        updatedAt: now,
      })
      .where(and(
        eq(lessonBookings.status, "confirmed"),
        lt(lessonBookings.endTime, now),
        isNotNull(lessonBookings.teacherJoinedAt)
      ))
      .returning();

    if (completedWithEarnings.length > 0) {
      totalUpdated += completedWithEarnings.length;
      results.push({
        action: "completed_with_earnings",
        count: completedWithEarnings.length,
        earningsPerLesson: LESSON_CONFIG.TEACHER_EARNINGS_PER_LESSON,
      });
    }

    // 3. confirmed → completed (öğretmen katılmadı): Ders bitmiş AMA öğretmen katılmamış → kazanç yok
    const completedNoEarnings = await db
      .update(lessonBookings)
      .set({
        status: "completed",
        completedAt: now,
        earningsAmount: 0,
        updatedAt: now,
      })
      .where(and(
        eq(lessonBookings.status, "confirmed"),
        lt(lessonBookings.endTime, now),
        isNull(lessonBookings.teacherJoinedAt)
      ))
      .returning();

    if (completedNoEarnings.length > 0) {
      totalUpdated += completedNoEarnings.length;
      results.push({
        action: "completed_no_earnings",
        count: completedNoEarnings.length,
      });
    }

    return NextResponse.json({
      message: totalUpdated > 0
        ? `${totalUpdated} ders durumu güncellendi`
        : "Güncellenecek ders bulunamadı",
      updated: totalUpdated,
      results,
    });
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/private-lesson/update-lesson-statuses" } }))
      .error({ message: "update lesson statuses failed", error, location: "api/private-lesson/update-lesson-statuses" });
    return NextResponse.json({
      message: "Ders durumları güncellenirken bir hata oluştu"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
