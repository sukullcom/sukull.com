import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { bookLesson, isApprovedStudent } from "@/db/queries";

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const isStudent = await isApprovedStudent(user.id);
    
    if (!isStudent) {
      return NextResponse.json({ message: "Only approved students can book lessons" }, { status: 403 });
    }
    
    const { teacherId, startTime, endTime, notes } = await request.json();
    
    if (!teacherId || !startTime || !endTime) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    // Parse dates from ISO strings
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);
    
    // Validate that the booking is for a 30-minute slot
    const durationMs = parsedEndTime.getTime() - parsedStartTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    
    if (durationMinutes !== 30) {
      return NextResponse.json({ message: "Bookings must be for 30-minute slots" }, { status: 400 });
    }
    
    const booking = await bookLesson(
      user.id,
      teacherId,
      parsedStartTime,
      parsedEndTime,
      notes
    );
    
    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error booking lesson:", error);
    
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 