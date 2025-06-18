import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getTeacherReviews } from "@/db/queries";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const teacherId = params.id;
    
    if (!teacherId) {
      return NextResponse.json({ message: "Teacher ID is required" }, { status: 400 });
    }
    
    // Get teacher reviews
    const reviewData = await getTeacherReviews(teacherId);
    
    return NextResponse.json(reviewData);
  } catch (error) {
    console.error("Error fetching teacher reviews:", error);
    return NextResponse.json({ 
      message: "An error occurred while fetching reviews" 
    }, { status: 500 });
  }
} 