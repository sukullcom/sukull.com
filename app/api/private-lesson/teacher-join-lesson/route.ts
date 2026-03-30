import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { lessonBookings } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { LESSON_CONFIG } from "@/lib/lesson-config";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ message: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId || isNaN(Number(bookingId))) {
      return NextResponse.json({ message: "Geçersiz rezervasyon" }, { status: 400 });
    }

    const booking = await db.query.lessonBookings.findFirst({
      where: and(
        eq(lessonBookings.id, Number(bookingId)),
        eq(lessonBookings.teacherId, user.id)
      ),
    });

    if (!booking) {
      return NextResponse.json({ message: "Rezervasyon bulunamadı veya bu işlem için yetkiniz yok" }, { status: 404 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ message: "İptal edilmiş derse katılamazsınız" }, { status: 400 });
    }

    if (booking.teacherJoinedAt) {
      return NextResponse.json({
        message: "Derse zaten katıldınız",
        meetLink: booking.meetLink,
      });
    }

    const now = new Date();
    const lessonStart = new Date(booking.startTime);
    const bufferMs = LESSON_CONFIG.JOIN_BUFFER_MINUTES * 60 * 1000;
    const lessonEnd = new Date(booking.endTime);

    if (now.getTime() < lessonStart.getTime() - bufferMs) {
      return NextResponse.json({
        message: `Derse yalnızca başlangıç saatinden ${LESSON_CONFIG.JOIN_BUFFER_MINUTES} dakika önce katılabilirsiniz`,
      }, { status: 400 });
    }

    if (now > lessonEnd) {
      return NextResponse.json({ message: "Ders süresi dolmuş" }, { status: 400 });
    }

    const updated = await db.update(lessonBookings)
      .set({ teacherJoinedAt: now, updatedAt: now })
      .where(and(
        eq(lessonBookings.id, Number(bookingId)),
        eq(lessonBookings.teacherId, user.id),
        isNull(lessonBookings.teacherJoinedAt)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({
        message: "Derse zaten katıldınız",
        meetLink: booking.meetLink,
      });
    }

    return NextResponse.json({
      message: "Derse katılım kaydedildi",
      meetLink: booking.meetLink,
    });
  } catch (error) {
    console.error("Derse katılım hatası:", error);
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
}
