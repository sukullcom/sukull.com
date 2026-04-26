import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";
import db from "@/db/drizzle";
import { teacherFields, teacherApplications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequestLogger } from "@/lib/logger";

export async function POST() {
  const log = await getRequestLogger({ labels: { route: "api/admin/migrate-teacher-fields" } });
  try {
    const actor = await getAdminActor();

    if (!actor) {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 401 });
    }

    log.info("starting teacher fields migration");

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

    log.info("found approved teacher applications", { count: approvedApplications.length });

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
        log.debug("skip: user not found or not teacher", { userId: application.userId });
        skippedCount++;
        continue;
      }

      // Check if we already have a field for this teacher with this display name
      const fieldKey = `${application.userId}-${application.field}`;
      if (existingFieldsMap.has(fieldKey)) {
        log.debug("skip: field already exists", { userId: application.userId });
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

        log.debug("migrated teacher field", { userId: application.userId, field: application.field });
        migratedCount++;
      } catch (error) {
        log.error({ message: "migrate field failed", error, location: "migrate-teacher-fields/loop", fields: { userId: application.userId } });
        skippedCount++;
      }
    }

    log.info("migration completed", { migrated: migratedCount, skipped: skippedCount });

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "admin.migrate_teacher_fields",
      metadata: {
        migrated: migratedCount,
        skipped: skippedCount,
        total: approvedApplications.length,
      },
    });

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
    log.error({ message: "migration failed", error, location: "api/admin/migrate-teacher-fields/POST" });
    // Do not surface raw `error.message` to the client, even for admin
    // tools: exception strings frequently leak table names, constraint
    // names, or internal library versions that help an attacker map
    // the schema if the admin session is ever replayed. Full details
    // remain in `error_log` for operators to triage.
    return NextResponse.json({
      success: false,
      message: "Migration failed. Check server logs for details.",
    }, { status: 500 });
  }
}
