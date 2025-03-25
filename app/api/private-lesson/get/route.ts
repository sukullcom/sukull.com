// app/api/private-lesson/get/route.ts

import { NextResponse } from "next/server";
import { saveStudentApplication } from "@/db/queries";
import { getServerUser } from "@/lib/auth";

export async function POST(request: Request) {
  const applicationData = await request.json();

  try {
    // Get the authenticated user
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Add the user ID to the application data
    const applicationWithUserId = {
      ...applicationData,
      userId: user.id,
    };

    await saveStudentApplication(applicationWithUserId);
    return NextResponse.json({ message: "Application saved successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error saving student application:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
