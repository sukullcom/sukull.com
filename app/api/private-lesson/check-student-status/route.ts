import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { isApprovedStudent } from "@/db/queries";

export async function GET() {
  try {
    // Get the current user
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ student: false, error: "Authentication required" }, { status: 401 });
    }

    // Check if user is an approved student
    const isStudent = await isApprovedStudent(user.id);
    
    return NextResponse.json({ 
      student: isStudent,
      studentId: isStudent ? user.id : null 
    });
  } catch (error) {
    console.error("Error checking student status:", error);
    return NextResponse.json({ student: false, error: "Internal server error" }, { status: 500 });
  }
} 