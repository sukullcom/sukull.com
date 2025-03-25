import { NextResponse } from "next/server";
import { getCurrentTeacherAvailability, getWeekStartDate, upsertTeacherAvailability, isTeacher } from "@/db/queries";
import { getServerUser } from "@/lib/auth";

// GET current teacher's availability for the current week
export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the user is a teacher using the isTeacher function
    const userIsTeacher = await isTeacher(user.id);
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Only teachers can access availability" }, { status: 403 });
    }
    
    const availability = await getCurrentTeacherAvailability(user.id);
    
    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Error fetching teacher availability:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}

// POST update current teacher's availability for the current week
export async function POST(req: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the user is a teacher using the isTeacher function
    const userIsTeacher = await isTeacher(user.id);
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Only teachers can update availability" }, { status: 403 });
    }
    
    const body = await req.json();
    const { slots } = body;
    
    if (!Array.isArray(slots)) {
      return NextResponse.json({ message: "Invalid slots format" }, { status: 400 });
    }
    
    // Validate the time slots
    const now = new Date();
    const weekStartDate = getWeekStartDate(now);
    
    // Process each slot - convert string dates to Date objects
    const processedSlots = slots.map(slot => {
      // Handle case where dates might be Date objects or ISO strings
      const startTime = typeof slot.startTime === 'string' 
        ? new Date(slot.startTime) 
        : slot.startTime;
      
      const endTime = typeof slot.endTime === 'string' 
        ? new Date(slot.endTime) 
        : slot.endTime;
      
      return {
        startTime,
        endTime,
        dayOfWeek: slot.dayOfWeek
      };
    });
    
    // Filter out invalid slots and separate past slots
    const futureSlots = [];
    const pastSlots = [];
    
    for (const slot of processedSlots) {
      const { startTime, endTime } = slot;
      
      // Check if the time is valid (30 minute intervals)
      if (
        startTime.getMinutes() % 30 !== 0 ||
        endTime.getMinutes() % 30 !== 0 ||
        endTime.getTime() - startTime.getTime() !== 30 * 60 * 1000
      ) {
        return NextResponse.json({ 
          message: "Invalid time slot. All slots must be 30-minute intervals." 
        }, { status: 400 });
      }
      
      // Check if the slot is in the past
      if (startTime < now) {
        // Add to past slots instead of rejecting the request
        pastSlots.push(slot);
      } else {
        // Only include future slots for saving
        futureSlots.push(slot);
      }
    }
    
    // Warn if some slots were filtered out
    const hasFilteredSlots = pastSlots.length > 0;
    
    // Save the availability (only future slots)
    try {
      const savedSlots = await upsertTeacherAvailability(user.id, weekStartDate, futureSlots);
      
      return NextResponse.json({ 
        message: hasFilteredSlots 
          ? "Availability updated successfully. Some past time slots were automatically removed." 
          : "Availability updated successfully", 
        availability: savedSlots,
        filtered: hasFilteredSlots,
        filteredCount: pastSlots.length
      });
    } catch (error) {
      console.error("Database error saving teacher availability:", error);
      return NextResponse.json({ message: "Error saving availability in database" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating teacher availability:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 