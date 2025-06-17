import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getTeacherReviews, isTeacher } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is a teacher
    const userIsTeacher = await isTeacher(user.id);
    
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Only teachers can access review data" }, { status: 403 });
    }
    
    // Get teacher review data
    const reviewData = await getTeacherReviews(user.id);
    
    return NextResponse.json(reviewData);
  } catch (error) {
    console.error("Error fetching teacher reviews:", error);
    return NextResponse.json({ 
      message: "An error occurred while fetching review data" 
    }, { status: 500 });
  }
} 