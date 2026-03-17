import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { lessonBookings } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { refundCredit } from "@/db/queries";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }
    
    const bookingId = parseInt(params.id);
    
    if (isNaN(bookingId)) {
      return NextResponse.json({ message: "Geçersiz rezervasyon" }, { status: 400 });
    }
    
    const booking = await db.query.lessonBookings.findFirst({
      where: and(
        eq(lessonBookings.id, bookingId),
        eq(lessonBookings.studentId, user.id)
      ),
    });
    
    if (!booking) {
      return NextResponse.json({ message: "Rezervasyon bulunamadı veya bu işlem için yetkiniz yok" }, { status: 404 });
    }
    
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return NextResponse.json({ message: "Bu ders zaten iptal edilmiş veya tamamlanmış" }, { status: 400 });
    }
    
    const startTime = new Date(booking.startTime);
    const now = new Date();
    const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      return NextResponse.json(
        { message: "Dersler yalnızca başlangıç saatinden en az 24 saat önce iptal edilebilir" },
        { status: 400 }
      );
    }
    
    const cancelled = await db.update(lessonBookings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(
        eq(lessonBookings.id, bookingId),
        eq(lessonBookings.studentId, user.id),
        ne(lessonBookings.status, 'cancelled'),
        ne(lessonBookings.status, 'completed')
      ))
      .returning();

    if (cancelled.length === 0) {
      return NextResponse.json({ message: "Bu ders zaten iptal edilmiş" }, { status: 400 });
    }

    await refundCredit(user.id);
    
    return NextResponse.json({ message: "Ders başarıyla iptal edildi ve krediniz iade edildi" });
  } catch (error) {
    console.error("Ders iptal hatası:", error);
    return NextResponse.json({ message: "Ders iptal edilirken bir hata oluştu" }, { status: 500 });
  }
} 