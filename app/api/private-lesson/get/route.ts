// app/api/private-lesson/get/route.ts

import { NextResponse } from "next/server";
import { saveStudentApplication } from "@/db/queries";

export async function POST(request: Request) {
  const applicationData = await request.json();

  try {
    await saveStudentApplication(applicationData);
    return NextResponse.json({ message: "Application saved successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error saving student application:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
