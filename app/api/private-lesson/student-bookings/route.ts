import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getStudentBookings, isApprovedStudent } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const isStudent = await isApprovedStudent(user.id);
    
    if (!isStudent) {
      return NextResponse.json({ message: "Only approved students can view their bookings" }, { status: 403 });
    }
    
    const bookings = await getStudentBookings(user.id);
    
    // Debug: Check if bookings have teacher info
    console.log(`Returning ${bookings.length} bookings to client`);
    if (bookings.length > 0) {
      const sampleBooking = bookings[0];
      console.log("Sample booking data:", {
        id: sampleBooking.id,
        teacherId: sampleBooking.teacherId,
        field: sampleBooking.field,
        hasTeacher: !!sampleBooking.teacher,
        teacherName: sampleBooking.teacher?.name || 'Missing'
      });
    }
    
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error getting student bookings:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 