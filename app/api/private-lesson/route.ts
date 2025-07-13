import { NextRequest, NextResponse } from "next/server";
import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { batchQueries, aggregationQueries, cachedQueries } from "@/db/optimized-queries";
import { 
  getStudentBookings, 
  getTeacherReviews, 
  getTeacherIncome, 
  isTeacher,
  submitLessonReview,
  isApprovedStudent,
  refundCredit,
  getTeacherFields,
  getTeacherApplicationByUserId,
  bookLesson,
  hasAvailableCredits
} from "@/db/queries";
import db from "@/db/drizzle";
import { lessonBookings, users, teacherApplications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
        // All authenticated users can be students
        return ApiResponses.success({ 
          student: true,
          studentId: user.id 
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
          return ApiResponses.forbidden("Only teachers can access review data");
        }
        
        const reviewData = await getTeacherReviews(user.id);
        return ApiResponses.success(reviewData);
      }

      case 'teacher-income': {
        const userIsTeacher = await isTeacher(user.id);
        if (!userIsTeacher) {
          return ApiResponses.forbidden("Only teachers can access income data");
        }
        
        // Use optimized aggregation query
        const incomeData = await aggregationQueries.getTeacherStatsOptimized(user.id);
        return ApiResponses.success(incomeData);
      }

      case 'teacher-details': {
        const userIsTeacher = await isTeacher(user.id);
        if (!userIsTeacher) {
          return ApiResponses.forbidden("Forbidden: User is not a teacher");
        }
        
        // Get user information from users table
        const userDetails = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });
        
        if (!userDetails) {
          return ApiResponses.notFound("User details not found");
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
          createdAt: userDetails.createdAt,
        });
      }

      case 'available-teachers': {
        // Use cached optimized query
        const teachers = await cachedQueries.getTeachersWithRatings();
        const subject = searchParams.get('subject');
        const grade = searchParams.get('grade');
        
        let filteredTeachers = teachers;
        
        if (subject || grade) {
          filteredTeachers = teachers.filter(teacher => {
            if (subject && !teacher.fields.some(field => 
              field.toLowerCase().includes(subject.toLowerCase())
            )) {
              return false;
            }
            
            if (grade && !teacher.fields.some(field => 
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
        return ApiResponses.badRequest("Invalid action parameter. Supported actions: check-teacher-status, check-student-status, student-bookings, teacher-reviews, teacher-income, teacher-details, available-teachers");
      }
    }
  } catch (error) {
    console.error(`Error in private-lesson GET ${action}:`, error);
    return ApiResponses.serverError("An error occurred while processing the request");
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
          return ApiResponses.forbidden("Only approved students can submit reviews");
        }
        
        const { bookingId, teacherId, rating, comment } = await request.json();
        
        // Validate input
        if (!bookingId || !teacherId || !rating) {
          return ApiResponses.badRequest("Missing required fields");
        }
        
        if (rating < 1 || rating > 5) {
          return ApiResponses.badRequest("Rating must be between 1 and 5");
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
          message: "Review submitted successfully",
          review: review[0]
        });
      }

      case 'cancel-lesson': {
        const { bookingId } = await request.json();
        
        if (!bookingId || isNaN(parseInt(bookingId))) {
          return ApiResponses.badRequest("Invalid booking ID");
        }
        
        const bookingIdNum = parseInt(bookingId);
        
        // Get the booking
        const booking = await db.query.lessonBookings.findFirst({
          where: and(
            eq(lessonBookings.id, bookingIdNum),
            eq(lessonBookings.studentId, user.id)
          ),
        });
        
        if (!booking) {
          return ApiResponses.notFound("Booking not found or you don't have permission to cancel it");
        }
        
        // Check if booking is already cancelled or completed
        if (booking.status === 'cancelled' || booking.status === 'completed') {
          return ApiResponses.badRequest(`Booking is already ${booking.status}`);
        }
        
        // Check if the booking is more than 24 hours in the future
        const startTime = new Date(booking.startTime);
        const now = new Date();
        const timeDiff = startTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return ApiResponses.badRequest("Lessons can only be cancelled at least 24 hours before the start time");
        }
        
        // Update the booking status to cancelled
        await db.update(lessonBookings)
          .set({ status: 'cancelled' })
          .where(eq(lessonBookings.id, bookingIdNum));
        
        // Refund the credit to the student
        await refundCredit(user.id);
        
        return ApiResponses.success({ message: "Lesson cancelled successfully and credit refunded" });
      }

      case 'book-lesson': {
        // Check if user is an approved student
        const isStudent = await isApprovedStudent(user.id);
        if (!isStudent) {
          return ApiResponses.forbidden("Only approved students can book lessons");
        }
        
        const { teacherId, startTime, endTime } = await request.json();
        
        // Validate input
        if (!teacherId || !startTime || !endTime) {
          return ApiResponses.badRequest("Missing required fields: teacherId, startTime, endTime");
        }
        
        // Validate dates
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return ApiResponses.badRequest("Invalid date format");
        }
        
        if (startDate >= endDate) {
          return ApiResponses.badRequest("Start time must be before end time");
        }
        
        if (startDate <= new Date()) {
          return ApiResponses.badRequest("Cannot book lessons in the past");
        }
        
        // Check if user has sufficient credits
        const hasCredits = await hasAvailableCredits(user.id, 1);
        if (!hasCredits) {
          return ApiResponses.badRequest("Insufficient credits. Please purchase credits to book a lesson.");
        }
        
        try {
          // Book the lesson (this function handles credit deduction and validation)
          const booking = await bookLesson(user.id, teacherId, startDate, endDate);
          
          return ApiResponses.created({ 
            message: "Lesson booked successfully",
            booking: booking[0]
          });
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes("Insufficient credits")) {
              return ApiResponses.badRequest(error.message);
            }
            if (error.message.includes("already booked") || error.message.includes("not available")) {
              return ApiResponses.conflict(error.message);
            }
          }
          throw error;
        }
      }

      default: {
        return ApiResponses.badRequest("Invalid action parameter. Supported POST actions: submit-review, cancel-lesson, book-lesson");
      }
    }
  } catch (error) {
    console.error(`Error in private-lesson POST ${action}:`, error);
    
    if (error instanceof Error) {
      return ApiResponses.badRequest(error.message);
    }
    
    return ApiResponses.serverError("An error occurred while processing the request");
  }
}); 