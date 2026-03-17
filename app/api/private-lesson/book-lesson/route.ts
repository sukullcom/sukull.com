import { NextRequest } from "next/server";
import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { bookLesson, hasAvailableCredits, isApprovedStudent } from "@/db/queries";

export const POST = secureApi.auth(async (request: NextRequest, user) => {
  try {
    // Check if user is an approved student
    const isStudent = await isApprovedStudent(user.id);
    if (!isStudent) {
      return ApiResponses.forbidden("Ders rezervasyonu yapabilmek için onaylı öğrenci olmanız gerekiyor");
    }
    
    const { teacherId, startTime, endTime } = await request.json();
    
    if (!teacherId || !startTime || !endTime) {
      return ApiResponses.badRequest("Lütfen tüm gerekli alanları doldurun");
    }
    
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return ApiResponses.badRequest("Geçersiz tarih formatı");
    }
    
    if (startDate >= endDate) {
      return ApiResponses.badRequest("Başlangıç zamanı bitiş zamanından önce olmalıdır");
    }
    
    if (startDate <= new Date()) {
      return ApiResponses.badRequest("Geçmişte ders rezervasyonu yapamazsınız");
    }
    
    // Check if user has sufficient credits
    const hasCredits = await hasAvailableCredits(user.id, 1);
    if (!hasCredits) {
      return ApiResponses.badRequest("Krediniz yetersiz. Lütfen ders rezervasyonu yapmak için kredi satın alın.");
    }
    
    // Book the lesson (this function handles credit deduction and validation)
    const booking = await bookLesson(user.id, teacherId, startDate, endDate);
    
    return ApiResponses.created({ 
      message: "Ders başarıyla rezerve edildi",
      booking: booking[0]
    });
    
  } catch (error) {
    console.error("Error booking lesson:", error);
    
    if (error instanceof Error) {
      return ApiResponses.badRequest(error.message);
    }
    
    return ApiResponses.serverError("Ders rezervasyonu sırasında bir hata oluştu");
  }
});

