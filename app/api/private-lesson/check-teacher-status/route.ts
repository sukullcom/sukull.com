import { NextResponse } from "next/server";
import { isTeacher } from "@/db/queries";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ teacher: false }, { status: 200 });
    }

    // Check if the user is a teacher
    const teacher = await isTeacher(user.id);
    
    return NextResponse.json({ teacher }, { status: 200 });
  } catch (error) {
    console.error("Error checking teacher status:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 