import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getTeacherReviews, isTeacher } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }
    
    const userIsTeacher = await isTeacher(user.id);
    
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Değerlendirme verilerine yalnızca eğitmenler erişebilir" }, { status: 403 });
    }
    
    const reviewData = await getTeacherReviews(user.id);
    
    return NextResponse.json(reviewData);
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/private-lesson/teacher-reviews" } }))
      .error({ message: "fetch teacher reviews failed", error, location: "api/private-lesson/teacher-reviews" });
    return NextResponse.json({ 
      message: "Değerlendirme verileri yüklenirken bir hata oluştu" 
    }, { status: 500 });
  }
}
