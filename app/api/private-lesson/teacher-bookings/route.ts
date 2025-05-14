import { NextResponse } from "next/server";
import { getAuthenticatedUser, requireTeacher } from "@/lib/auth";
import { getTeacherBookings } from "@/db/queries";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // First, authenticate the user (will redirect to login if not authenticated)
    await getAuthenticatedUser();
    
    // Then verify teacher role (will redirect to unauthorized if not a teacher)
    const teacherUser = await requireTeacher();
    
    // Get the teacher's info to include the meet link
    const teacherInfo = await db.query.users.findFirst({
      where: eq(users.id, teacherUser.id),
      columns: {
        meetLink: true,
        name: true,
        email: true,
      },
    });
    
    // Get the bookings with student info
    const bookings = await getTeacherBookings(teacherUser.id);
    
    // Log the response for debugging
    console.log(`Returning ${bookings.length} bookings to teacher ${teacherUser.id}`);
    
    return NextResponse.json({ 
      bookings,
      teacherMeetLink: teacherInfo?.meetLink || null,
      teacherName: teacherInfo?.name || null,
      success: true
    });
  } catch (error) {
    console.error("Error getting teacher bookings:", error);
    
    // Handle specific errors differently
    if ((error as any)?.status === 401) {
      return NextResponse.json({ 
        message: "Authentication required", 
        error: "unauthorized" 
      }, { status: 401 });
    }
    
    if ((error as any)?.status === 403) {
      return NextResponse.json({ 
        message: "Teacher authorization required", 
        error: "forbidden" 
      }, { status: 403 });
    }
    
    return NextResponse.json({ 
      message: "Failed to retrieve bookings", 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 