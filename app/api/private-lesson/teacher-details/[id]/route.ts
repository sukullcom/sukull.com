import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getTeacherDetails, getTeacherAvailabilityForCurrentWeek } from "@/db/queries";
import { and, eq, gte, lte, not } from "drizzle-orm";
import db from "@/db/drizzle";
import { lessonBookings } from "@/db/schema";

// Define interfaces for the availability and booking slots
interface AvailabilitySlot {
  id: number;
  teacherId: string;
  startTime: Date;
  endTime: Date;
  dayOfWeek: number;
  weekStartDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BookingSlot {
  id: number;
  studentId: string;
  teacherId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  meetLink?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Teacher details endpoint called for ID:", params.id);
    
    // Add a protective check for invalid teacher ID
    if (!params.id) {
      console.log("Missing teacher ID parameter");
      return NextResponse.json({ message: "Teacher ID is required" }, { status: 400 });
    }
    
    const user = await getServerUser();
    
    if (!user) {
      console.log("Unauthorized: No user found");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // For debugging, don't require student status check initially
    // const isStudent = await isApprovedStudent(user.id);
    // 
    // if (!isStudent) {
    //   console.log("Forbidden: User is not an approved student", user.id);
    //   return NextResponse.json({ message: "Only approved students can view teacher details" }, { status: 403 });
    // }
    
    const teacherId = params.id;
    console.log("Getting teacher details for ID:", teacherId);
    
    const teacher = await getTeacherDetails(teacherId);
    
    if (!teacher) {
      console.log("Teacher not found for ID:", teacherId);
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }
    
    console.log("Teacher found:", teacher.name);
    
    // Get availability for the current week
    console.log("Getting availability for teacher ID:", teacherId);
    let availability: AvailabilitySlot[] = [];
    try {
      const availabilityData = await getTeacherAvailabilityForCurrentWeek(teacherId);
      availability = availabilityData as AvailabilitySlot[];
      console.log("Availability found:", availability.length, "slots");
    } catch (availabilityError) {
      console.error("Error fetching availability:", availabilityError);
      // Continue without availability data
    }
    
    // Get booked slots for the current week
    console.log("Getting booked slots for teacher ID:", teacherId);
    let bookedSlots: BookingSlot[] = [];
    try {
      // Get the current week's start and end dates
      const today = new Date();
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Adjust to get Monday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      console.log(`Looking for bookings between ${startOfWeek.toISOString()} and ${endOfWeek.toISOString()}`);
      
      // Query the database for bookings within this week
      const bookingSlotsData = await db.query.lessonBookings.findMany({
        where: and(
          eq(lessonBookings.teacherId, teacherId),
          gte(lessonBookings.startTime, startOfWeek),
          lte(lessonBookings.startTime, endOfWeek),
          // Include all bookings that aren't cancelled
          not(eq(lessonBookings.status, "cancelled"))
        )
      });
      
      bookedSlots = bookingSlotsData as BookingSlot[];
      console.log("Booked slots found:", bookedSlots.length);
      
      // Log each booked slot for debugging
      bookedSlots.forEach((slot, index) => {
        console.log(`Booked slot #${index + 1}:`, {
          id: slot.id,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          status: slot.status,
          dayOfWeek: slot.startTime.getDay()
        });
      });
    } catch (bookingsError) {
      console.error("Error fetching booked slots:", bookingsError);
      // Continue without booked slots data
    }
    
    return NextResponse.json({ 
      teacher, 
      availability, 
      bookedSlots,
      debug: {
        userId: user.id,
        requestedTeacherId: teacherId,
        availabilityCount: availability.length,
        bookedSlotsCount: bookedSlots.length
      }
    });
  } catch (error) {
    console.error("Error getting teacher details:", error);
    return NextResponse.json({ 
      message: "An error occurred.", 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined
    }, { status: 500 });
  }
} 