import { NextResponse } from "next/server";
import { getServerUser, checkUserRole } from "@/lib/auth";
import { getTeacherBookings } from "@/db/queries";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Get the authenticated user
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ 
        message: "Authentication required", 
        error: "unauthorized" 
      }, { status: 401 });
    }
    
    // Check if the user is a teacher
    const isTeacher = await checkUserRole("teacher");
    
    if (!isTeacher) {
      return NextResponse.json({ 
        message: "Teacher authorization required", 
        error: "forbidden" 
      }, { status: 403 });
    }
    
    // Get the teacher's info to include the meet link
    const teacherInfo = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        meetLink: true,
        name: true,
        email: true,
      },
    });
    
    // Get the bookings with student info
    const bookings = await getTeacherBookings(user.id);
    
    // Log the response for debugging
    console.log(`Returning ${bookings.length} bookings to teacher ${user.id}`);
    
    return NextResponse.json({ 
      bookings,
      teacherMeetLink: teacherInfo?.meetLink || null,
      teacherName: teacherInfo?.name || null,
      success: true
    });
  } catch (error) {
    console.error("Error getting teacher bookings:", error);
    
    return NextResponse.json({ 
      message: "Failed to retrieve bookings", 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 