import { NextResponse } from "next/server";
import { performDailyReset } from "@/actions/daily-streak";
import { isAdmin } from "@/lib/admin";

export async function POST() {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    console.log("🧪 Manual daily reset triggered by admin");
    
    const result = await performDailyReset();
    
    if (result.success) {
      return NextResponse.json(
        { 
          success: true, 
          message: "Daily reset completed successfully",
          summary: result.summary
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: "Daily reset failed",
          error: result.error,
          details: result.details
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in manual daily reset:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Daily reset test endpoint",
    usage: "POST to trigger manual daily reset (admin only)"
  });
} 