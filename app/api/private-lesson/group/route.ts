// app/api/private-lesson/group/route.ts
import { NextResponse } from "next/server";
import { saveEnglishGroupApplication } from "@/db/queries";

export async function POST(request: Request) {
  const applicationData = await request.json();

  try {
    // e.g. we store quizResult=0, classification=""
    const inserted = await saveEnglishGroupApplication(applicationData);
    // inserted might return: { id: 123, ... }
    // we can pass that ID back to the client
    return NextResponse.json(
      { message: "Application saved successfully.", id: inserted[0].id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving English group application:", error);
    return NextResponse.json(
      { message: "An error occurred." },
      { status: 500 }
    );
  }
}
