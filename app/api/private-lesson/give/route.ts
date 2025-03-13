// app/api/private-lesson/give/route.ts

import { NextResponse } from "next/server";
import { saveTeacherApplication } from "@/db/queries";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const applicationData = await request.json();

  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Add the user ID to the application data
    const applicationWithUserId = {
      ...applicationData,
      userId: user.id,
    };

    await saveTeacherApplication(applicationWithUserId);
    return NextResponse.json({ message: "Application saved successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error saving teacher application:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}
