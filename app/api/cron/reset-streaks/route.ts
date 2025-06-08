import { NextRequest, NextResponse } from "next/server";
import { checkAndResetStreaks } from "@/actions/daily-streak";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log("Unauthorized cron attempt:", authHeader);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const startTime = new Date();
    console.log("Daily streak reset job started at:", startTime.toISOString());
    
    const result = await checkAndResetStreaks();
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    if (result) {
      console.log(`Daily streak reset job completed successfully in ${duration}ms`);
      return NextResponse.json(
        { 
          success: true, 
          message: "Daily streak reset completed successfully",
          timestamp: endTime.toISOString(),
          duration: `${duration}ms`
        },
        { status: 200 }
      );
    } else {
      console.error("Daily streak reset job failed");
      return NextResponse.json(
        { 
          success: false, 
          message: "Daily streak reset failed",
          timestamp: endTime.toISOString(),
          duration: `${duration}ms`
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

// GET method for health check
export async function GET() {
  return NextResponse.json(
    { 
      message: "Daily streak reset endpoint is healthy",
      timestamp: new Date().toISOString(),
      instructions: "Use POST with Bearer token to trigger reset"
    },
    { status: 200 }
  );
} 