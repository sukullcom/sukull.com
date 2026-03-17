import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { submitLessonReview, isApprovedStudent } from "@/db/queries";

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }
    
    const isStudent = await isApprovedStudent(user.id);
    
    if (!isStudent) {
      return NextResponse.json({ message: "Yalnızca onaylı öğrenciler değerlendirme yapabilir" }, { status: 403 });
    }
    
    const { bookingId, teacherId, rating, comment } = await request.json();
    
    if (!bookingId || !teacherId || !rating) {
      return NextResponse.json({ message: "Lütfen tüm gerekli alanları doldurun" }, { status: 400 });
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Puan 1 ile 5 arasında olmalıdır" }, { status: 400 });
    }
    
    const review = await submitLessonReview(
      bookingId,
      user.id,
      teacherId,
      rating,
      comment
    );
    
    return NextResponse.json({ 
      message: "Değerlendirmeniz başarıyla gönderildi",
      review: review[0]
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
} 