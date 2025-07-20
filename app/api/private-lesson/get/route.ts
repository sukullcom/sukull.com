import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { privateLessonApplications } from "@/db/schema";

// Student Application Submission
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
      studentName,
      studentSurname,
      studentPhoneNumber,
      studentEmail,
      field,
      studentNeeds = ""
    } = body;

    // Validate required fields
    if (!studentName || !studentSurname || !studentPhoneNumber || !studentEmail || !field) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already has a student application
    const existingApplication = await db.query.privateLessonApplications.findFirst({
      where: (privateLessonApplications, { eq }) => eq(privateLessonApplications.userId, user.id),
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already submitted a student application" },
        { status: 400 }
      );
    }

    // Create student application
    const application = await db.insert(privateLessonApplications).values({
      userId: user.id,
      studentName,
      studentSurname,
      studentPhoneNumber,
      studentEmail,
      field,
      studentNeeds,
      status: "pending",
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      message: "Student application submitted successfully",
      application: application[0]
    }, { status: 201 });

  } catch (error) {
    console.error("Error submitting student application:", error);
    return NextResponse.json(
      { error: "An error occurred while submitting your application" },
      { status: 500 }
    );
  }
} 