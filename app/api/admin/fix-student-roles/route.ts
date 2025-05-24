import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { privateLessonApplications, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST() {
  try {
    // Get the authenticated user
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ 
        message: "Authentication required", 
        error: "unauthorized" 
      }, { status: 401 });
    }
    
    // Check if user is an admin
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { role: true }
    });
    
    if (userRecord?.role !== "admin") {
      return NextResponse.json({ 
        message: "Admin access required", 
        error: "forbidden" 
      }, { status: 403 });
    }
    
    // Find all approved student applications with valid userId
    const approvedApplications = await db.query.privateLessonApplications.findMany({
      where: and(
        eq(privateLessonApplications.approved, true)
      ),
      columns: {
        userId: true
      }
    });
    
    // Filter out applications without userId
    const userIds = approvedApplications
      .filter(app => app.userId)
      .map(app => app.userId as string);
    
    // Update all these users to have "student" role if they don't already
    const updates = await Promise.all(
      userIds.map(async userId => {
        // Check current role
        const currentUser = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { role: true }
        });
        
        // Only update if not already student or teacher (don't downgrade teachers)
        if (currentUser?.role !== "student" && currentUser?.role !== "teacher") {
          await db.update(users)
            .set({ role: "student" })
            .where(eq(users.id, userId));
          return userId;
        }
        return null;
      })
    );
    
    // Filter out nulls and count successful updates
    const updatedUsers = updates.filter(Boolean);
    
    return NextResponse.json({ 
      message: `Successfully updated ${updatedUsers.length} user roles to 'student'`,
      updatedUsers,
      success: true
    });
    
  } catch (error) {
    console.error("Error fixing student roles:", error);
    
    return NextResponse.json({ 
      message: "Failed to update student roles",
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 