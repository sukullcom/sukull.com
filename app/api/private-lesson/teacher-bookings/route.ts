import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { getTeacherBookings } from "@/db/queries";

// ✅ TEACHER BOOKINGS: Get all bookings for the current teacher
export const GET = secureApi.auth(async (request, user) => {
  try {
    // Get teacher bookings with student details
    const bookings = await getTeacherBookings(user.id);
    
    // Get the teacher's meet link for quick access
    const teacherProfile = await import("@/db/drizzle").then(({ default: db }) => 
      db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, user.id),
        columns: { meetLink: true }
      })
    );

    return ApiResponses.success({ 
      bookings,
      teacherMeetLink: teacherProfile?.meetLink || null,
      count: bookings.length
    });
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/private-lesson/teacher-bookings" } }))
      .error({ message: "fetch teacher bookings failed", error, location: "api/private-lesson/teacher-bookings" });
    return ApiResponses.serverError("Rezervasyonlar yüklenirken bir hata oluştu");
  }
}); 