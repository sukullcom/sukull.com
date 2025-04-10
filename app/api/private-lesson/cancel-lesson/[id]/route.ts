import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { lessonBookings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const bookingId = parseInt(params.id);
    
    if (isNaN(bookingId)) {
      return NextResponse.json({ message: "Invalid booking ID" }, { status: 400 });
    }
    
    // Get the booking
    const booking = await db.query.lessonBookings.findFirst({
      where: and(
        eq(lessonBookings.id, bookingId),
        eq(lessonBookings.studentId, user.id)
      ),
    });
    
    if (!booking) {
      return NextResponse.json({ message: "Booking not found or you don't have permission to cancel it" }, { status: 404 });
    }
    
    // Check if booking is already cancelled or completed
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return NextResponse.json({ message: `Booking is already ${booking.status}` }, { status: 400 });
    }
    
    // Check if the booking is more than 24 hours in the future
    const startTime = new Date(booking.startTime);
    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      return NextResponse.json(
        { message: "Lessons can only be cancelled at least 24 hours before the start time" },
        { status: 400 }
      );
    }
    
    // Update the booking status to cancelled
    await db.update(lessonBookings)
      .set({ status: 'cancelled' })
      .where(eq(lessonBookings.id, bookingId));
    
    return NextResponse.json({ message: "Lesson cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling lesson:", error);
    
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 