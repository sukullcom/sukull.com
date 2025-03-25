import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { isApprovedStudent } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const isStudent = await isApprovedStudent(user.id);
    
    return NextResponse.json({ student: isStudent });
  } catch (error) {
    console.error("Error checking student status:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 