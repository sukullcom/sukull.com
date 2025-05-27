import { NextRequest, NextResponse } from "next/server";
import { checkAndResetStreaks } from "@/actions/daily-streak";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (you can add your own auth logic here)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Daily streak reset job started at:", new Date().toISOString());
    
    const result = await checkAndResetStreaks();
    
    if (result) {
      console.log("Daily streak reset job completed successfully");
      return NextResponse.json(
        { 
          success: true, 
          message: "Daily streak reset completed successfully",
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    } else {
      console.error("Daily streak reset job failed");
      return NextResponse.json(
        { 
          success: false, 
          message: "Daily streak reset failed",
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in daily streak reset job:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET method not allowed for security
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
} 