import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getStudentBookings, isApprovedStudent } from "@/db/queries";

interface AuthError {
  status: number;
  message: string;
}

export async function GET() {
  try {
    // Get the authenticated user
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ 
        message: "Authentication required", 
        error: "unauthorized" 
      }, { status: 401 });
    }
    
    // Check if user is an approved student
    const isStudent = await isApprovedStudent(user.id);
    
    if (!isStudent) {
      return NextResponse.json(
        { 
          message: "Only approved students can view their bookings",
          error: "forbidden"
        }, 
        { status: 403 }
      );
    }
    
    // Get bookings with teacher info
    const bookings = await getStudentBookings(user.id);
    
    // Log the response for debugging
    console.log(`Returning ${bookings.length} bookings to client for user ${user.id}`);
    
    return NextResponse.json({ 
      bookings,
      success: true 
    });
    
  } catch (error) {
    console.error("Error getting student bookings:", error);
    
    // Handle specific errors differently
    if ((error as AuthError)?.status === 401) {
      return NextResponse.json({ 
        message: "Authentication required", 
        error: "unauthorized" 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      message: "Failed to retrieve bookings", 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 