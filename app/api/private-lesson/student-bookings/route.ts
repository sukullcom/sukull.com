import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getStudentBookings } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const bookings = await getStudentBookings(user.id);

    return NextResponse.json({
      bookings,
      count: bookings.length
    });
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/private-lesson/student-bookings" } }))
      .error({ message: "fetch student bookings failed", error, location: "api/private-lesson/student-bookings" });
    return NextResponse.json({ error: "Sunucu tarafında bir hata oluştu." }, { status: 500 });
  }
}
