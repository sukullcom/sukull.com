import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getAvailableTeachers, isApprovedStudent } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const isStudent = await isApprovedStudent(user.id);
    
    if (!isStudent) {
      return NextResponse.json({ message: "Only approved students can view available teachers" }, { status: 403 });
    }
    
    const teachers = await getAvailableTeachers();
    
    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error getting available teachers:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 