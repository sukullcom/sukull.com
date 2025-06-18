import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { users, teacherApplications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isTeacher, getTeacherFields } from "@/db/queries";

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
    
    // Get teacher application information (for field)
    const teacherApplication = await db.query.teacherApplications.findFirst({
      where: eq(teacherApplications.userId, user.id),
    });
    
    // Get teacher fields from the new system
    const teacherFieldsData = await getTeacherFields(user.id);
    
    // Determine field display - use new system if available, fallback to legacy
    let fieldDisplay = "";
    let fields: string[] = [];
    
    if (teacherFieldsData && teacherFieldsData.length > 0) {
      fields = teacherFieldsData.map(f => f.displayName);
      fieldDisplay = fields.join(", ");
    } else if (teacherApplication?.field) {
      fieldDisplay = teacherApplication.field;
      fields = [teacherApplication.field];
    }
    
    // Combine data from both sources
    const teacherProfile = {
      id: userDetails.id,
      name: userDetails.name,
      email: userDetails.email,
      avatar: userDetails.avatar,
      bio: userDetails.description,
      meetLink: userDetails.meetLink,
      field: fieldDisplay,
      fields: fields, // Array of all fields
    };
    
    return NextResponse.json(teacherProfile);
  } catch (error) {
    console.error("Error getting teacher profile:", error);
    return NextResponse.json({ 
      message: "An error occurred while fetching teacher profile"
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    
    // Parse the request body
    const data: { bio?: string } = await request.json();
    
    // Update bio (saved as description in the users table)
    if (data.bio !== undefined) {
      await db
        .update(users)
        .set({ description: data.bio })
        .where(eq(users.id, user.id));
    }
    
    return NextResponse.json({ 
      message: "Profile updated successfully",
      updated: true
    });
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    return NextResponse.json({ 
      message: "An error occurred while updating the profile",
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 