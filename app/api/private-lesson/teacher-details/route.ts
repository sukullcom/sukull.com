import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { users, teacherApplications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isTeacher } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is a teacher
    const userIsTeacher = await isTeacher(user.id);
    
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Forbidden: User is not a teacher" }, { status: 403 });
    }
    
    // Get user information from users table
    const userDetails = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    
    if (!userDetails) {
      return NextResponse.json({ message: "User details not found" }, { status: 404 });
    }
    
    // Get teacher application information (for field and price range)
    const teacherApplication = await db.query.teacherApplications.findFirst({
      where: eq(teacherApplications.userId, user.id),
    });
    
    // Combine data from both sources
    const teacherProfile = {
      id: userDetails.id,
      name: userDetails.name,
      email: userDetails.email,
      avatar: userDetails.avatar,
      bio: userDetails.description,
      meetLink: userDetails.meetLink,
      field: teacherApplication?.field || "",
      priceRange: teacherApplication?.priceRange || "",
    };
    
    return NextResponse.json(teacherProfile);
  } catch (error) {
    console.error("Error getting teacher profile:", error);
    return NextResponse.json({ 
      message: "An error occurred while fetching teacher profile"
    }, { status: 500 });
  }
} 