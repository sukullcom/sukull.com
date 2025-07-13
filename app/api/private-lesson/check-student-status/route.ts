import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";

export async function GET() {
  try {
    // Get the current user
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ student: false, error: "Authentication required" }, { status: 401 });
    }

    // For now, all authenticated users can be students
    // You can add more complex logic here if needed (e.g., check for student role)
    return NextResponse.json({ 
      student: true,
      studentId: user.id 
    });
  } catch (error) {
    console.error("Error checking student status:", error);
    return NextResponse.json({ student: false, error: "Internal server error" }, { status: 500 });
  }
} 