import { NextResponse } from "next/server";
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
    console.error("Error fetching teacher bookings:", error);
    return ApiResponses.serverError("An error occurred while fetching bookings");
  }
}); 