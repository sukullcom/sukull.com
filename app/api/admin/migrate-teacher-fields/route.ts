import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import db from "@/db/drizzle";
import { teacherFields, teacherApplications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST() {
  try {
    // Check if the user is an admin
    const admin = await isAdmin();
    
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting teacher fields migration...");

    // Get all approved teacher applications
    const approvedApplications = await db.query.teacherApplications.findMany({
      where: and(
        eq(teacherApplications.status, "approved")
      ),
      columns: {
        userId: true,
        field: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log(`Found ${approvedApplications.length} approved teacher applications`);

    // Get all existing teacher fields to avoid duplicates
    const existingFields = await db.query.teacherFields.findMany({
      columns: {
        teacherId: true,
        displayName: true,
      }
    });

    const existingFieldsMap = new Set(
      existingFields.map(f => `${f.teacherId}-${f.displayName}`)
    );

    let migratedCount = 0;
    let skippedCount = 0;

    // Migrate each application
    for (const application of approvedApplications) {
      // Check if user exists and is a teacher
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, application.userId),
          eq(users.role, "teacher")
        ),
        columns: { id: true }
      });

      if (!user) {
        console.log(`Skipping application for user ${application.userId} - user not found or not a teacher`);
        skippedCount++;
        continue;
      }

      // Check if we already have a field for this teacher with this display name
      const fieldKey = `${application.userId}-${application.field}`;
      if (existingFieldsMap.has(fieldKey)) {
        console.log(`Skipping application for user ${application.userId} - field already exists`);
        skippedCount++;
        continue;
      }

      // Parse the field to extract subject and grade
      let subject = application.field;
      let grade = "Genel";
      
      // Try to extract grade info from field
      const gradeMatch = application.field.match(/(\d+\.?\s*(sınıf|Sınıf))/i);
      if (gradeMatch) {
        grade = gradeMatch[1];
        subject = application.field.replace(gradeMatch[0], '').trim();
      }

      try {
        // Insert the new teacher field
        await db.insert(teacherFields).values({
          teacherId: application.userId,
          subject: subject,
          grade: grade,
          displayName: application.field,
          isActive: true,
          createdAt: application.createdAt || new Date(),
          updatedAt: application.updatedAt || new Date(),
        });

        console.log(`Migrated field for teacher ${application.userId}: ${application.field}`);
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating field for teacher ${application.userId}:`, error);
        skippedCount++;
      }
    }

    console.log(`Migration completed. Migrated: ${migratedCount}, Skipped: ${skippedCount}`);

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully.`,
      stats: {
        migrated: migratedCount,
        skipped: skippedCount,
        total: approvedApplications.length
      }
    });

  } catch (error) {
    console.error("Error during migration:", error);
    return NextResponse.json({ 
      success: false,
      message: "Migration failed", 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 