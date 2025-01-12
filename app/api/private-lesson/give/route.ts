// app/api/private-lesson/give/route.ts

import { NextResponse } from "next/server";
import { saveTeacherApplication } from "@/db/queries";

export async function POST(request: Request) {
  const applicationData = await request.json();

  try {
    await saveTeacherApplication(applicationData);
    return NextResponse.json({ message: "Application saved successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error saving teacher application:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
