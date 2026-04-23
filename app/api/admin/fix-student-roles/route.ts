import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";
import { getRequestLogger } from "@/lib/logger";
import db from "@/db/drizzle";
import { users, privateLessonApplications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type AffectedUser = {
  userId: string;
  email: string | null;
  name: string | null;
  currentRole: string | null;
};

/**
 * Onaylanmış öğrenci başvurusu olan ama `users.role` değeri hâlâ
 * `student|teacher|admin` dışında olan kullanıcıları bulur.
 *
 * `approveStudentApplication` artık rol senkronizasyonunu kendi yapıyor —
 * bu araç tarihsel tutarsızlıkların (manuel DB düzenlemesi, eski onaylar,
 * yarış koşulları) yakalanması içindir.
 */
async function findAffectedUsers(): Promise<AffectedUser[]> {
  const approved = await db.query.privateLessonApplications.findMany({
    where: and(eq(privateLessonApplications.status, "approved")),
    columns: { userId: true },
  });

  const affected: AffectedUser[] = [];
  const seen = new Set<string>();

  for (const app of approved) {
    if (!app.userId || seen.has(app.userId)) continue;
    seen.add(app.userId);

    const record = await db.query.users.findFirst({
      where: eq(users.id, app.userId),
      columns: { id: true, email: true, name: true, role: true },
    });

    if (!record) continue;

    const role = record.role ?? null;
    if (role !== "student" && role !== "teacher" && role !== "admin") {
      affected.push({
        userId: record.id,
        email: record.email ?? null,
        name: record.name ?? null,
        currentRole: role,
      });
    }
  }

  return affected;
}

/** GET → kuru prova: hangi kullanıcıların etkileneceğini döner. */
export async function GET() {
  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json(
        { error: "Bu işlem için yönetici yetkisi gereklidir." },
        { status: 403 },
      );
    }

    const affected = await findAffectedUsers();
    return NextResponse.json({
      affectedCount: affected.length,
      affectedUsers: affected,
    });
  } catch (error) {
    {
      const log = await getRequestLogger({ labels: { route: "api/admin/fix-student-roles", op: "preview" } });
      log.error({ message: "preview fix failed", error, location: "api/admin/fix-student-roles/preview" });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 },
    );
  }
}

/** POST → etkilenen kullanıcıların rolünü `student` olarak günceller. */
export async function POST() {
  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json(
        { error: "Bu işlem için yönetici yetkisi gereklidir." },
        { status: 403 },
      );
    }

    const affected = await findAffectedUsers();

    if (affected.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        updatedUsers: [],
        message: "Güncellenecek kullanıcı bulunmadı. Tüm roller tutarlı.",
      });
    }

    const updatedUsers: string[] = [];
    for (const user of affected) {
      await db.update(users)
        .set({ role: "student", updated_at: new Date() })
        .where(eq(users.id, user.userId));
      updatedUsers.push(user.userId);
    }

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user.fix_student_roles",
      metadata: { updatedCount: updatedUsers.length, updatedUsers },
    });

    return NextResponse.json({
      success: true,
      updatedCount: updatedUsers.length,
      updatedUsers,
      message: `${updatedUsers.length} kullanıcının rolü "student" olarak güncellendi.`,
    });
  } catch (error) {
    {
      const log = await getRequestLogger({ labels: { route: "api/admin/fix-student-roles", op: "fix" } });
      log.error({ message: "fix student roles failed", error, location: "api/admin/fix-student-roles/POST" });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 },
    );
  }
}
