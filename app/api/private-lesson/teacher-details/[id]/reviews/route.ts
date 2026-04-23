import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getTeacherReviews } from "@/db/queries";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }
    
    const teacherId = params.id;
    
    if (!teacherId) {
      return NextResponse.json({ message: "Eğitmen kimliği gerekli" }, { status: 400 });
    }
    
    const reviewData = await getTeacherReviews(teacherId);
    
    return NextResponse.json(reviewData);
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/private-lesson/teacher-details/reviews" } }))
      .error({ message: "fetch teacher reviews (by id) failed", error, location: "api/private-lesson/teacher-details/[id]/reviews" });
    return NextResponse.json({ 
      message: "Değerlendirmeler yüklenirken bir hata oluştu" 
    }, { status: 500 });
  }
}
