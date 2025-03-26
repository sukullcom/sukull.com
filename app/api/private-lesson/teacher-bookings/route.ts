import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getTeacherBookings, isTeacher } from "@/db/queries";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const teacherCheck = await isTeacher(user.id);
    
    if (!teacherCheck) {
      return NextResponse.json({ message: "Only teachers can view their bookings" }, { status: 403 });
    }
    
    // Get the teacher's info to include the meet link
    const teacherInfo = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        meetLink: true,
      },
    });
    
    // Get the bookings with student info
    const bookings = await getTeacherBookings(user.id);
    
    return NextResponse.json({ 
      bookings,
      teacherMeetLink: teacherInfo?.meetLink || null
    });
  } catch (error) {
    console.error("Error getting teacher bookings:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 