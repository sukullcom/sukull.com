import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getTeacherAvailabilityForCurrentWeek } from "@/db/queries";
import { and, eq, gte, lte, not } from "drizzle-orm";
import db from "@/db/drizzle";
import { lessonBookings, users, userProgress, teacherApplications } from "@/db/schema";

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
    // Add a protective check for invalid teacher ID
    if (!params.id) {
      return NextResponse.json({ message: "Teacher ID is required" }, { status: 400 });
    }
    
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const teacherId = params.id;
    
    // Get teacher details from users table
    const teacher = await db.query.users.findFirst({
      where: eq(users.id, teacherId),
      columns: {
        id: true,
        name: true,
        email: true,
        description: true,
        avatar: true,
        meetLink: true,
      }
    });
    
    if (!teacher) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }
    
    // Get teacher profile image from userProgress
    const teacherProfile = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, teacherId),
      columns: {
        userImageSrc: true,
      }
    });
    
    // Get teacher application details for field
    const teacherApplication = await db.query.teacherApplications.findFirst({
      where: eq(teacherApplications.userId, teacherId),
      columns: {
        field: true,
      }
    });
    
    // Combine all teacher details
    const teacherWithDetails = {
      ...teacher,
      bio: teacher.description,
      avatar: teacherProfile?.userImageSrc || teacher.avatar,
      field: teacherApplication?.field || "",
    };
    
    // Get availability for the current week
    let availability: AvailabilitySlot[] = [];
    try {
      const availabilityData = await getTeacherAvailabilityForCurrentWeek(teacherId);
      const now = new Date();
      
      // Filter out past time slots
      availability = (availabilityData as AvailabilitySlot[]).filter(slot => {
        return slot.startTime > now;
      });
    } catch (availabilityError) {
      console.error("Error fetching availability:", availabilityError);
      // Continue without availability data
    }
    
    // Get booked slots for the current week
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
    } catch (bookingsError) {
      console.error("Error fetching booked slots:", bookingsError);
      // Continue without booked slots data
    }
    
    return NextResponse.json({ 
      teacher: teacherWithDetails, 
      availability, 
      bookedSlots
    });
  } catch (error) {
    console.error("Error getting teacher details:", error);
    return NextResponse.json({ 
      message: "An error occurred.", 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Make sure the user can only update their own profile
    if (user.id !== params.id) {
      return NextResponse.json({ message: "Forbidden: You can only update your own profile" }, { status: 403 });
    }
    
    // Parse the request body
    const data = await request.json();
    
    // Update bio (saved as description in the users table)
    if (data.bio !== undefined) {
      await db
        .update(users)
        .set({ description: data.bio })
        .where(eq(users.id, user.id));
    }
    
    return NextResponse.json({ 
      message: "Profile updated successfully",
      updated: true
    });
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    return NextResponse.json({ 
      message: "An error occurred while updating the profile",
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 