import { and, eq } from "drizzle-orm";
import db from "@/db/drizzle";
import { messageUnlocks, teacherApplications, users } from "@/db/schema";

function isTeacherRole(role: string): boolean {
  return role === "teacher";
}

/**
 * Resolves a display phone: profile `users.phone` first, then for
 * teachers the approved application phone.
 */
export async function resolvePhoneForUser(
  userId: string,
  role: string,
): Promise<string | null> {
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { phone: true },
  });
  if (row?.phone?.trim()) return row.phone.trim();
  if (isTeacherRole(role)) {
    const app = await db.query.teacherApplications.findFirst({
      where: and(
        eq(teacherApplications.userId, userId),
        eq(teacherApplications.status, "approved"),
      ),
      columns: { teacherPhoneNumber: true },
    });
    if (app?.teacherPhoneNumber?.trim()) return app.teacherPhoneNumber.trim();
  }
  return null;
}

export type PrivateLessonContactPayload = {
  you: { name: string; email: string; phone: string | null };
  other: { name: string; email: string; phone: string | null };
};

/**
 * Returns contact details for a student–teacher pair only if
 * `message_unlocks` exists (student paid, teacher offered, or both).
 */
export async function getPrivateLessonContactForPair(
  viewerId: string,
  otherUserId: string,
): Promise<
  | { ok: true; data: PrivateLessonContactPayload }
  | { ok: false; code: "not_found" | "not_unlocked" | "invalid_pair" }
> {
  const [viewer, other] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, viewerId),
      columns: { id: true, name: true, email: true, role: true },
    }),
    db.query.users.findFirst({
      where: eq(users.id, otherUserId),
      columns: { id: true, name: true, email: true, role: true },
    }),
  ]);
  if (!viewer || !other) return { ok: false, code: "not_found" };

  let studentId: string;
  let teacherId: string;
  if (isTeacherRole(viewer.role) && !isTeacherRole(other.role)) {
    studentId = other.id;
    teacherId = viewer.id;
  } else if (!isTeacherRole(viewer.role) && isTeacherRole(other.role)) {
    studentId = viewer.id;
    teacherId = other.id;
  } else {
    return { ok: false, code: "invalid_pair" };
  }

  const unlock = await db.query.messageUnlocks.findFirst({
    where: and(
      eq(messageUnlocks.studentId, studentId),
      eq(messageUnlocks.teacherId, teacherId),
    ),
    columns: { id: true },
  });
  if (!unlock) return { ok: false, code: "not_unlocked" };

  const [yourPhone, theirPhone] = await Promise.all([
    resolvePhoneForUser(viewer.id, viewer.role),
    resolvePhoneForUser(other.id, other.role),
  ]);

  return {
    ok: true,
    data: {
      you: {
        name: viewer.name,
        email: viewer.email,
        phone: yourPhone,
      },
      other: {
        name: other.name,
        email: other.email,
        phone: theirPhone,
      },
    },
  };
}
