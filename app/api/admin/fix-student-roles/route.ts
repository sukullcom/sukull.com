import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import db from "@/db/drizzle";
import { users, privateLessonApplications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Bu işlem için yönetici yetkisi gereklidir." }, { status: 403 });
    }

    const approvedApplications = await db.query.privateLessonApplications.findMany({
      where: and(
        eq(privateLessonApplications.status, "approved"),
      ),
    });

    const updatedUsers: string[] = [];

    for (const app of approvedApplications) {
      if (!app.userId) continue;

      const userRecord = await db.query.users.findFirst({
        where: eq(users.id, app.userId),
        columns: { id: true, role: true },
      });

      if (userRecord && userRecord.role !== "student" && userRecord.role !== "teacher" && userRecord.role !== "admin") {
        await db.update(users)
          .set({ role: "student", updated_at: new Date() })
          .where(eq(users.id, app.userId));
        updatedUsers.push(app.userId);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedUsers.length} user(s) to student role`,
      updatedUsers,
    });
  } catch (error) {
    console.error("Error fixing student roles:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
