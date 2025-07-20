import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { teacherApplications } from "@/db/schema";

// Teacher Application Submission
export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      teacherName,
      teacherSurname,
      teacherPhoneNumber,
      teacherEmail,
      field,
      quizResult = 0,
      passed = true,
      priceRange = "0-100 TL"
    } = body;

    // Validate required fields
    if (!teacherName || !teacherSurname || !teacherPhoneNumber || !teacherEmail || !field) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already has a teacher application
    const existingApplication = await db.query.teacherApplications.findFirst({
      where: (teacherApplications, { eq }) => eq(teacherApplications.userId, user.id),
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already submitted a teacher application" },
        { status: 400 }
      );
    }

    // Create teacher application
    const application = await db.insert(teacherApplications).values({
      userId: user.id,
      field,
      quizResult,
      passed,
      teacherName,
      teacherSurname,
      teacherPhoneNumber,
      teacherEmail,
      classification: "pending", // Set initial status
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({
      message: "Teacher application submitted successfully",
      application: application[0]
    }, { status: 201 });

  } catch (error) {
    console.error("Error submitting teacher application:", error);
    return NextResponse.json(
      { error: "An error occurred while submitting your application" },
      { status: 500 }
    );
  }
} 