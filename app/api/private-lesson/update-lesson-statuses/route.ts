import { NextResponse } from "next/server";
import db from "@/db/drizzle";
import { lessonBookings } from "@/db/schema";
import { eq, lt, and, not } from "drizzle-orm";

export async function POST() {
  try {
    const now = new Date();
    let totalUpdated = 0;
    let results = [];

    // 1. First, find all pending bookings where the start time has arrived and confirm them
    const pendingBookings = await db.query.lessonBookings.findMany({
      where: and(
        eq(lessonBookings.status, "pending"),
        lt(lessonBookings.startTime, now)
      ),
    });

    if (pendingBookings.length > 0) {
      const confirmedResult = await db
        .update(lessonBookings)
        .set({ 
          status: "confirmed",
          updatedAt: now
        })
        .where(and(
          eq(lessonBookings.status, "pending"),
          lt(lessonBookings.startTime, now)
        ))
        .returning();

      totalUpdated += confirmedResult.length;
      results.push({
        action: "confirmed",
        count: confirmedResult.length,
        bookings: confirmedResult.map(booking => ({
          id: booking.id,
          teacherId: booking.teacherId,
          studentId: booking.studentId,
          startTime: booking.startTime
        }))
      });

      console.log(`Updated ${confirmedResult.length} lessons to confirmed status`);
    }

    // 2. Then, find all confirmed bookings where the end time has passed and complete them
    const expiredBookings = await db.query.lessonBookings.findMany({
      where: and(
        eq(lessonBookings.status, "confirmed"),
        lt(lessonBookings.endTime, now)
      ),
    });

    if (expiredBookings.length > 0) {
      const completedResult = await db
        .update(lessonBookings)
        .set({ 
          status: "completed",
          updatedAt: now
        })
        .where(and(
          eq(lessonBookings.status, "confirmed"),
          lt(lessonBookings.endTime, now)
        ))
        .returning();

      totalUpdated += completedResult.length;
      results.push({
        action: "completed",
        count: completedResult.length,
        bookings: completedResult.map(booking => ({
          id: booking.id,
          teacherId: booking.teacherId,
          studentId: booking.studentId,
          endTime: booking.endTime
        }))
      });

      console.log(`Updated ${completedResult.length} lessons to completed status`);
    }

    if (totalUpdated === 0) {
      return NextResponse.json({ 
        message: "No lessons to update",
        updated: 0 
      });
    }

    return NextResponse.json({ 
      message: `Successfully updated ${totalUpdated} lessons`,
      updated: totalUpdated,
      results: results
    });

  } catch (error) {
    console.error("Error updating lesson statuses:", error);
    return NextResponse.json({ 
      message: "Failed to update lesson statuses",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Allow GET requests as well for easier testing
export async function GET() {
  return POST();
} 