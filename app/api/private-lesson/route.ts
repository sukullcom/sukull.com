import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { NextResponse } from "next/server";
import { batchQueries, aggregationQueries, cachedQueries } from "@/db/optimized-queries";
import { 
  isTeacher,
  submitLessonReview,
  isApprovedStudent,
  refundCredit,
  getTeacherFields,
  bookLesson,
  hasAvailableCredits,
  getTeacherReviews
} from "@/db/queries";
import db from "@/db/drizzle";
import { lessonBookings, users, teacherApplications } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

// ✅ CONSOLIDATED PRIVATE LESSON API: Replaces multiple scattered endpoints

// This file consolidates private lesson functionality into a single API endpoint

// GET handler - supports multiple actions via query parameters
export const GET = secureApi.auth(async (request, user) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'check-teacher-status': {
        const teacherStatus = await isTeacher(user.id);
        return ApiResponses.success({ 
          teacher: teacherStatus,
          teacherId: teacherStatus ? user.id : null 
        });
      }

      case 'check-student-status': {
        // Check if user is an approved student
        const isStudent = await isApprovedStudent(user.id);
        return ApiResponses.success({ 
          student: isStudent,
          studentId: isStudent ? user.id : null 
        });
      }

      case 'student-bookings': {
        // Use optimized query instead of N+1
        const bookings = await batchQueries.getStudentBookingsWithTeacherData(user.id);
        return ApiResponses.success({ 
          bookings,
          count: bookings.length
        });
      }

      case 'teacher-reviews': {
        const userIsTeacher = await isTeacher(user.id);
        if (!userIsTeacher) {
          return ApiResponses.forbidden("Değerlendirme verilerine yalnızca eğitmenler erişebilir");
        }
        
        const reviewData = await getTeacherReviews(user.id);
        return ApiResponses.success(reviewData);
      }

      case 'teacher-income': {
        const userIsTeacher = await isTeacher(user.id);
        if (!userIsTeacher) {
          return ApiResponses.forbidden("Gelir verilerine yalnızca eğitmenler erişebilir");
        }
        
        // Use optimized aggregation query
        const incomeData = await aggregationQueries.getTeacherStatsOptimized(user.id);
        return ApiResponses.success(incomeData);
      }

      case 'teacher-details': {
        const userIsTeacher = await isTeacher(user.id);
        if (!userIsTeacher) {
          return ApiResponses.forbidden("Bu alana yalnızca eğitmenler erişebilir");
        }
        
        // Get user information from users table
        const userDetails = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });
        
        if (!userDetails) {
          return ApiResponses.notFound("Kullanıcı bilgileri bulunamadı");
        }
        
        // Get teacher application information (for field)
        const teacherApplication = await db.query.teacherApplications.findFirst({
          where: eq(teacherApplications.userId, user.id),
        });
        
        // Get teacher fields from the new system
        const teacherFieldsData = await getTeacherFields(user.id);
        
        // Determine field display - use new system if available, fallback to legacy
        let fieldDisplay = "";
        let fields: string[] = [];
        
        if (teacherFieldsData && teacherFieldsData.length > 0) {
          fields = teacherFieldsData.map(f => f.displayName);
          fieldDisplay = fields.join(", ");
        } else if (teacherApplication?.field) {
          fieldDisplay = teacherApplication.field;
          fields = [teacherApplication.field];
        }
        
        return ApiResponses.success({
          id: userDetails.id,
          name: userDetails.name,
          email: userDetails.email,
          avatar: userDetails.avatar,
          description: userDetails.description,
          meetLink: userDetails.meetLink,
          field: fieldDisplay,
          fields: fields,
          createdAt: userDetails.created_at,
        });
      }

      case 'available-teachers': {
        // Use cached optimized query
        const teachers = await cachedQueries.getTeachersWithRatings();
        const subject = searchParams.get('subject');
        const grade = searchParams.get('grade');
        
        let filteredTeachers = teachers;
        
        if (subject || grade) {
          filteredTeachers = teachers.filter((teacher: { fields: string[] }) => {
            if (subject && !teacher.fields.some((field: string) => 
              field.toLowerCase().includes(subject.toLowerCase())
            )) {
              return false;
            }
            
            if (grade && !teacher.fields.some((field: string) => 
              field.toLowerCase().includes(grade.toLowerCase())
            )) {
              return false;
            }
            
            return true;
          });
        }
        
        return ApiResponses.success({ teachers: filteredTeachers });
      }

      default: {
        return ApiResponses.badRequest("Geçersiz işlem parametresi");
      }
    }
  } catch (error) {
    console.error(`Error in private-lesson GET ${action}:`, error);
    return ApiResponses.serverError("İstek işlenirken bir hata oluştu");
  }
});

// POST handler - for actions that modify data
export const POST = secureApi.auth(async (request, user) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'submit-review': {
        // Check if user is an approved student
        const isStudent = await isApprovedStudent(user.id);
        if (!isStudent) {
          return ApiResponses.forbidden("Yalnızca onaylı öğrenciler değerlendirme yapabilir");
        }
        
        const { bookingId, teacherId, rating, comment } = await request.json();
        
        // Validate input
        if (!bookingId || !teacherId || !rating) {
          return ApiResponses.badRequest("Gerekli alanlar eksik");
        }
        
        if (rating < 1 || rating > 5) {
          return ApiResponses.badRequest("Değerlendirme 1 ile 5 arasında olmalıdır");
        }
        
        // Submit the review
        const review = await submitLessonReview(
          bookingId,
          user.id,
          teacherId,
          rating,
          comment
        );
        
        return ApiResponses.created({ 
          message: "Değerlendirmeniz başarıyla gönderildi",
          review: review[0]
        });
      }

      case 'cancel-lesson': {
        const { bookingId } = await request.json();
        
        if (!bookingId || isNaN(parseInt(bookingId))) {
          return ApiResponses.badRequest("Geçersiz rezervasyon");
        }
        
        const bookingIdNum = parseInt(bookingId);
        
        const booking = await db.query.lessonBookings.findFirst({
          where: and(
            eq(lessonBookings.id, bookingIdNum),
            eq(lessonBookings.studentId, user.id)
          ),
        });
        
        if (!booking) {
          return ApiResponses.notFound("Rezervasyon bulunamadı veya bu işlem için yetkiniz yok");
        }
        
        if (booking.status === 'cancelled' || booking.status === 'completed') {
          return ApiResponses.badRequest("Bu ders zaten iptal edilmiş veya tamamlanmış");
        }
        
        const startTime = new Date(booking.startTime);
        const now = new Date();
        const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return ApiResponses.badRequest("Dersler yalnızca başlangıç saatinden en az 24 saat önce iptal edilebilir");
        }
        
        const cancelled = await db.update(lessonBookings)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(and(
            eq(lessonBookings.id, bookingIdNum),
            eq(lessonBookings.studentId, user.id),
            ne(lessonBookings.status, 'cancelled'),
            ne(lessonBookings.status, 'completed')
          ))
          .returning();

        if (cancelled.length === 0) {
          return ApiResponses.badRequest("Bu ders zaten iptal edilmiş");
        }

        await refundCredit(user.id);
        
        return ApiResponses.success({ message: "Ders iptal edildi ve kredi iade edildi" });
      }

      case 'book-lesson': {
        // Check if user is an approved student
        const isStudent = await isApprovedStudent(user.id);
        if (!isStudent) {
          return ApiResponses.forbidden("Sadece onaylanmış öğrenciler ders rezervasyonu yapabilir");
        }
        
        const { teacherId, startTime, endTime } = await request.json();
        
        // Validate input
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
          return ApiResponses.badRequest("Geçmiş tarihli ders rezervasyonu yapılamaz");
        }
        
        // Check if user has sufficient credits
        const hasCredits = await hasAvailableCredits(user.id, 1);
        if (!hasCredits) {
          return ApiResponses.badRequest("Krediniz yetersiz. Lütfen ders rezervasyonu yapmak için kredi satın alın.");
        }
        
        try {
          // Book the lesson (this function handles credit deduction and validation)
          const booking = await bookLesson(user.id, teacherId, startDate, endDate);
          
          return ApiResponses.created({ 
            message: "Ders rezervasyonu başarıyla tamamlandı",
            booking: booking[0]
          });
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("Yetersiz kredi")) {
              return ApiResponses.badRequest(error.message);
            }
            if (error.message.includes("rezerve edilmiş") || error.message.includes("müsait değil")) {
              return NextResponse.json({ error: error.message }, { status: 409 });
            }
          }
          throw error;
        }
      }

      default: {
        return ApiResponses.badRequest("Geçersiz işlem parametresi");
      }
    }
  } catch (error) {
    console.error(`Error in private-lesson POST ${action}:`, error);
    
    if (error instanceof Error) {
      return ApiResponses.badRequest(error.message);
    }
    
    return ApiResponses.serverError("İstek işlenirken bir hata oluştu");
  }
}); 