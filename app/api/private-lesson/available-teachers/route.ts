import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getAvailableTeachers, isApprovedStudent } from "@/db/queries";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { users, teacherApplications, userProgress } from "@/db/schema";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Get available teachers with their fields and profile info
    const teachers = await db.query.users.findMany({
      where: eq(users.role, "teacher"),
      columns: {
        id: true,
        name: true,
        email: true,
        description: true,
        avatar: true,
        meetLink: true,
      }
    });
    
    // Get teacher application data (for field)
    const teacherIds = teachers.map(t => t.id);
    const applications = await db.query.teacherApplications.findMany({
      where: eq(teacherApplications.status, "approved"),
      columns: {
        userId: true,
        field: true,
        priceRange: true,
      }
    });
    
    // Get profile images from userProgress
    const profileImages = await db.query.userProgress.findMany({
      where: (fields, { inArray }) => inArray(fields.userId, teacherIds),
      columns: {
        userId: true,
        userImageSrc: true,
      }
    });
    
    // Map applications to teachers by userId
    const applicationMap = new Map();
    applications.forEach(app => {
      applicationMap.set(app.userId, app);
    });
    
    // Map profile images by userId
    const profileImageMap = new Map();
    profileImages.forEach(profile => {
      profileImageMap.set(profile.userId, profile.userImageSrc);
    });
    
    // Combine teacher info with application data and profile images
    const teachersWithFields = teachers.map(teacher => {
      const application = applicationMap.get(teacher.id);
      const profileImage = profileImageMap.get(teacher.id);
      
      return {
        ...teacher,
        bio: teacher.description, // Rename description to bio for consistency
        field: application?.field || "",
        priceRange: application?.priceRange || "",
        avatar: profileImage || teacher.avatar, // Use profile image if available, fall back to avatar
      };
    });
    
    return NextResponse.json({ teachers: teachersWithFields });
  } catch (error) {
    console.error("Error getting available teachers:", error);
    return NextResponse.json({ message: "Failed to get available teachers" }, { status: 500 });
  }
} 