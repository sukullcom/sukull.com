/**
 * Active-teacher directory surface: profile / rate / field lookups used
 * by the public rehber (listing of approved teachers) and by the
 * teacher dashboard.
 *
 * The marketplace refactor (migration 0026) removed the availability,
 * booking and review system. Ratings are intentionally NOT displayed
 * yet — we will add a post-match review mechanism later. For now the
 * directory just shows what the teacher offers and at what rate.
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import { teacherApplications, teacherFields, users } from "@/db/schema";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache-tags";
import { queryResultRows } from "@/lib/query-result";

// ---------------------------------------------------------------------------
// Directory — "rehber" listing on /private-lesson/teachers
// ---------------------------------------------------------------------------

export type TeacherDirectoryRow = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  field: string;
  fields: string[];
  hourlyRateOnline: number | null;
  hourlyRateInPerson: number | null;
  lessonMode: string | null;
  city: string | null;
  district: string | null;
};

/**
 * Approved-teachers directory. Joins users → teacher_applications (for
 * rates / lesson mode / location) → teacher_fields (for displayable
 * subject+grade pills). Cached with a short TTL + tag-based
 * invalidation when a teacher's profile changes.
 */
const _getTeachersDirectoryCached = unstable_cache(
  async (): Promise<TeacherDirectoryRow[]> => {
    const result = await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.description AS bio,
        COALESCE(ta.hourly_rate_online, NULL)    AS hourly_rate_online,
        COALESCE(ta.hourly_rate_in_person, NULL) AS hourly_rate_in_person,
        ta.lesson_mode                           AS lesson_mode,
        ta.city                                  AS city,
        ta.district                              AS district,
        STRING_AGG(DISTINCT tf.display_name, ', ') AS fields_new,
        MAX(ta.field)                              AS field_legacy
      FROM users u
      LEFT JOIN teacher_applications ta
        ON ta.user_id = u.id AND ta.status = 'approved'
      LEFT JOIN teacher_fields tf
        ON tf.teacher_id = u.id AND tf.is_active = true
      WHERE u.role = 'teacher'
      GROUP BY u.id, u.name, u.email, u.avatar, u.description,
               ta.hourly_rate_online, ta.hourly_rate_in_person,
               ta.lesson_mode, ta.city, ta.district
      ORDER BY u.name ASC
    `);

    const rows = queryResultRows<Record<string, unknown>>(result);
    return rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      avatar: (row.avatar as string | null) ?? null,
      bio: (row.bio as string | null) ?? null,
      field:
        (row.fields_new as string) ||
        (row.field_legacy as string) ||
        "",
      fields: row.fields_new
        ? String(row.fields_new).split(", ")
        : row.field_legacy
          ? [String(row.field_legacy)]
          : [],
      hourlyRateOnline:
        row.hourly_rate_online != null ? Number(row.hourly_rate_online) : null,
      hourlyRateInPerson:
        row.hourly_rate_in_person != null
          ? Number(row.hourly_rate_in_person)
          : null,
      lessonMode: (row.lesson_mode as string | null) ?? null,
      city: (row.city as string | null) ?? null,
      district: (row.district as string | null) ?? null,
    }));
  },
  ["teachers-directory-v2"],
  { tags: [CACHE_TAGS.teachers], revalidate: CACHE_TTL.teachers },
);

export const getTeachersDirectory = cache(async () =>
  _getTeachersDirectoryCached(),
);

// ---------------------------------------------------------------------------
// Profile page — single teacher
// ---------------------------------------------------------------------------

export async function getTeacherProfile(teacherId: string) {
  const [user, application, fields] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, teacherId),
      columns: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        description: true,
        role: true,
      },
    }),
    db.query.teacherApplications.findFirst({
      where: eq(teacherApplications.userId, teacherId),
      columns: {
        bio: true,
        field: true,
        education: true,
        experienceYears: true,
        targetLevels: true,
        availableHours: true,
        lessonMode: true,
        hourlyRate: true,
        hourlyRateOnline: true,
        hourlyRateInPerson: true,
        city: true,
        district: true,
      },
    }),
    db.query.teacherFields.findMany({
      where: and(
        eq(teacherFields.teacherId, teacherId),
        eq(teacherFields.isActive, true),
      ),
      columns: { subject: true, grade: true, displayName: true },
    }),
  ]);

  if (!user || user.role !== "teacher") return null;

  return {
    ...user,
    bio: application?.bio ?? user.description ?? null,
    field: application?.field ?? null,
    education: application?.education ?? null,
    experienceYears: application?.experienceYears ?? null,
    targetLevels: application?.targetLevels ?? null,
    availableHours: application?.availableHours ?? null,
    lessonMode: application?.lessonMode ?? null,
    hourlyRateOnline: application?.hourlyRateOnline ?? null,
    hourlyRateInPerson: application?.hourlyRateInPerson ?? null,
    hourlyRate: application?.hourlyRate ?? null,
    city: application?.city ?? null,
    district: application?.district ?? null,
    fields,
  };
}
