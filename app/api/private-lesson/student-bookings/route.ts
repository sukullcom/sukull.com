import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { batchQueries } from "@/db/optimized-queries";

// ✅ OPTIMIZED: Uses single query with joins instead of N+1 queries
export async function GET() {
  try {
    // Get the current user
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // ✅ IMPROVED: Use optimized batch query instead of N+1
    const bookings = await batchQueries.getStudentBookingsWithTeacherData(user.id);

    return NextResponse.json({ 
      bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error("Error fetching student bookings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 