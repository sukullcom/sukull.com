import { NextResponse } from "next/server";
import { getServerUser, checkUserRole } from "@/lib/auth";
import { isTeacher } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check user role from multiple sources for robustness
    const hasTeacherRole = await checkUserRole("teacher");
    const isTeacherByQuery = await isTeacher(user.id);
    
    // User is considered a teacher if either check passes
    const isAuthorizedTeacher = hasTeacherRole || isTeacherByQuery;
    
    return NextResponse.json({ 
      teacher: isAuthorizedTeacher,
      userId: user.id
    });
  } catch (error) {
    console.error("Error checking teacher status:", error);
    return NextResponse.json({ 
      message: "An error occurred while checking teacher status.",
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 