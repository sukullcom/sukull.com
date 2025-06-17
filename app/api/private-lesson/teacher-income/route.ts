import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getTeacherIncome, isTeacher } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is a teacher
    const userIsTeacher = await isTeacher(user.id);
    
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Only teachers can access income data" }, { status: 403 });
    }
    
    // Get teacher income data
    const incomeData = await getTeacherIncome(user.id);
    
    return NextResponse.json(incomeData);
  } catch (error) {
    console.error("Error fetching teacher income:", error);
    return NextResponse.json({ 
      message: "An error occurred while fetching income data" 
    }, { status: 500 });
  }
} 