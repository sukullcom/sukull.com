import { and, eq, or } from "drizzle-orm";
import db from "@/db/drizzle";
import { messageUnlocks, teacherApplications, users } from "@/db/schema";
import { isTeacher } from "@/db/queries/applications";

/**
 * Resolves a display phone: profile `users.phone` first, then for
 * teachers the approved application phone.
 */
export async function resolvePhoneForUser(userId: string): Promise<string | null> {
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { phone: true },
  });
  if (row?.phone?.trim()) return row.phone.trim();
  if (await isTeacher(userId)) {
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
 * `message_unlocks` exists. Roller çoklu olabilir; öğrenci/eğitmen kimliği
 * kilidi tablosundan okunur.
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
      columns: { id: true, name: true, email: true },
    }),
    db.query.users.findFirst({
      where: eq(users.id, otherUserId),
      columns: { id: true, name: true, email: true },
    }),
  ]);
  if (!viewer || !other) return { ok: false, code: "not_found" };

  const unlock = await db.query.messageUnlocks.findFirst({
    where: or(
      and(
        eq(messageUnlocks.studentId, viewerId),
        eq(messageUnlocks.teacherId, otherUserId),
      ),
      and(
        eq(messageUnlocks.studentId, otherUserId),
        eq(messageUnlocks.teacherId, viewerId),
      ),
    ),
    columns: { id: true, studentId: true, teacherId: true },
  });
  if (!unlock) return { ok: false, code: "not_unlocked" };

  const [yourPhone, theirPhone] = await Promise.all([
    resolvePhoneForUser(viewer.id),
    resolvePhoneForUser(other.id),
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
