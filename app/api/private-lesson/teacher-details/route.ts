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
    
    // Get teacher application information (for field)
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
    const data: { bio?: string; field?: string } = await request.json();
    
    // Update bio (saved as description in the users table)
    if (data.bio !== undefined) {
      await db
        .update(users)
        .set({ description: data.bio })
        .where(eq(users.id, user.id));
    }
    
    // Update field (saved in teacherApplications table)
    if (data.field !== undefined) {
      // First, check if teacher application record exists
      const existingApplication = await db.query.teacherApplications.findFirst({
        where: eq(teacherApplications.userId, user.id),
      });
      
      if (existingApplication) {
        // Update existing record
        await db
          .update(teacherApplications)
          .set({ 
            field: data.field,
            updatedAt: new Date()
          })
          .where(eq(teacherApplications.userId, user.id));
      } else {
        // Create new record if it doesn't exist (fallback)
        await db.insert(teacherApplications).values({
          userId: user.id,
          field: data.field || "",
          status: "approved", // Since user is already a teacher
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
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