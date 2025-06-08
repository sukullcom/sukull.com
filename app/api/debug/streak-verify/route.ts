import { NextResponse } from "next/server";
import { verifyStreakSystem } from "@/actions/daily-streak";
import { getServerUser } from "@/lib/auth";

export async function GET() {
  try {
    // Check if user is authenticated
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run the verification
    await verifyStreakSystem();
    
    return NextResponse.json({ 
      success: true, 
      message: "Streak system verification completed. Check server logs for details.",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in streak verification endpoint:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Verification failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST method not allowed
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
} 