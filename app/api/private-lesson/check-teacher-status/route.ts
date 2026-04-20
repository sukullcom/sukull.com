import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { isTeacher } from "@/db/queries";

export async function GET() {
  try {
    // Get the current user
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ teacher: false, error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    // Check if user is a teacher using the existing function
    const teacherStatus = await isTeacher(user.id);

    return NextResponse.json({ 
      teacher: teacherStatus,
      teacherId: teacherStatus ? user.id : null 
    });
  } catch (error) {
    console.error("Error checking teacher status:", error);
    return NextResponse.json({ teacher: false, error: "Sunucu tarafında bir hata oluştu." }, { status: 500 });
  }
} 