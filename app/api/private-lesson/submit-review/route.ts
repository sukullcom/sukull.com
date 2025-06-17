import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { submitLessonReview, isApprovedStudent } from "@/db/queries";

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is an approved student
    const isStudent = await isApprovedStudent(user.id);
    
    if (!isStudent) {
      return NextResponse.json({ message: "Only approved students can submit reviews" }, { status: 403 });
    }
    
    const { bookingId, teacherId, rating, comment } = await request.json();
    
    // Validate input
    if (!bookingId || !teacherId || !rating) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Rating must be between 1 and 5" }, { status: 400 });
    }
    
    // Submit the review
    const review = await submitLessonReview(
      bookingId,
      user.id,
      teacherId,
      rating,
      comment
    );
    
    return NextResponse.json({ 
      message: "Review submitted successfully",
      review: review[0]
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 