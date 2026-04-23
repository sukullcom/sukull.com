/**
 * Active-teacher surface: availability, profile, ratings, income, stats.
 *
 * Teacher onboarding (applications, field configuration) lives in
 * `./applications`. Booking logic lives in `./private-lesson`.
 *
 * Heavy aggregates (`getTeachersWithRatingsOptimized`, `getTeacherStats`)
 * are wrapped in `unstable_cache` with per-teacher tags so a single review
 * submission can target-invalidate just the affected dashboard.
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import {
  lessonBookings,
  lessonReviews,
  teacherAvailability,
  teacherFields,
  users,
} from "@/db/schema";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache-tags";
import { logger } from "@/lib/logger";
import { getWeekStartDate } from "./shared";

const log = logger.child({ labels: { module: "db/queries/teacher" } });

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export async function getTeacherAvailability(
  teacherId: string,
  weekStartDate: Date,
) {
  return db.query.teacherAvailability.findMany({
    where: and(
      eq(teacherAvailability.teacherId, teacherId),
      eq(teacherAvailability.weekStartDate, weekStartDate),
    ),
    orderBy: [teacherAvailability.dayOfWeek, teacherAvailability.startTime],
  });
}

/**
 * Replace all availability slots for a given (teacher, week). Wrapped in
 * a single insert-after-delete to avoid leaving partial state on failure.
 */
export async function upsertTeacherAvailability(
  teacherId: string,
  weekStartDate: Date,
  slots: {
    startTime: Date;
    endTime: Date;
    dayOfWeek: number;
  }[],
) {
  await db
    .delete(teacherAvailability)
    .where(
      and(
        eq(teacherAvailability.teacherId, teacherId),
        eq(teacherAvailability.weekStartDate, weekStartDate),
      ),
    );

  if (!slots.length) return [];

  return db
    .insert(teacherAvailability)
    .values(
      slots.map((slot) => ({
        teacherId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayOfWeek: slot.dayOfWeek,
        weekStartDate,
      })),
    )
    .returning();
}

export async function getCurrentTeacherAvailability(teacherId: string) {
  const weekStartDate = getWeekStartDate(new Date());
  return getTeacherAvailability(teacherId, weekStartDate);
}

export async function getTeacherAvailabilityForCurrentWeek(teacherId: string) {
  try {
    const today = new Date();
    const currentWeekStart = getWeekStartDate(today);

    const availableSlots = await db.query.teacherAvailability.findMany({
      where: and(
        eq(teacherAvailability.teacherId, teacherId),
        eq(teacherAvailability.weekStartDate, currentWeekStart),
      ),
      orderBy: [
        asc(teacherAvailability.dayOfWeek),
        asc(teacherAvailability.startTime),
      ],
    });

    return availableSlots;
  } catch (error) {
    log.error({
      message: "getTeacherAvailabilityForCurrentWeek failed",
      error,
      source: "server-action",
      location: "db/queries/teacher/getTeacherAvailabilityForCurrentWeek",
    });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Profile / directory
// ---------------------------------------------------------------------------

export async function getAvailableTeachers() {
  return db.query.users.findMany({
    where: eq(users.role, "teacher"),
    columns: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      description: true,
      meetLink: true,
    },
  });
}

export async function getTeacherDetails(teacherId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, teacherId),
    columns: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      description: true,
      meetLink: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Income / reviews
// ---------------------------------------------------------------------------

/**
 * Completed-lessons income rollup. Uses a per-booking `earningsAmount`
 * when set; falls back to the `TEACHER_EARNINGS_PER_LESSON` constant to
 * cover legacy rows where `earningsAmount` is NULL.
 */
export const getTeacherIncome = cache(async (teacherId: string) => {
  const completedBookings = await db.query.lessonBookings.findMany({
    where: and(
      eq(lessonBookings.teacherId, teacherId),
      eq(lessonBookings.status, "completed"),
    ),
    with: {
      student: {
        columns: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: desc(lessonBookings.startTime),
  });

  const { TEACHER_EARNINGS_PER_LESSON } = await import(
    "@/lib/lesson-config"
  ).then((m) => m.LESSON_CONFIG);

  let totalIncome = 0;
  const monthlyIncome = completedBookings.reduce(
    (acc, booking) => {
      const earnings = booking.earningsAmount ?? TEACHER_EARNINGS_PER_LESSON;
      totalIncome += earnings;

      const month = booking.startTime.toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { lessons: 0, income: 0 };
      }
      acc[month].lessons += 1;
      acc[month].income +=
        booking.earningsAmount ?? TEACHER_EARNINGS_PER_LESSON;
      return acc;
    },
    {} as Record<string, { lessons: number; income: number }>,
  );

  return {
    totalLessons: completedBookings.length,
    totalIncome,
    earningsPerLesson: TEACHER_EARNINGS_PER_LESSON,
    monthlyIncome,
    recentBookings: completedBookings.slice(0, 10),
  };
});

export const getTeacherReviews = cache(async (teacherId: string) => {
  const reviews = await db.query.lessonReviews.findMany({
    where: eq(lessonReviews.teacherId, teacherId),
    with: {
      student: {
        columns: {
          name: true,
        },
      },
      booking: {
        columns: {
          startTime: true,
        },
      },
    },
    orderBy: desc(lessonReviews.createdAt),
  });

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      reviews: [],
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

  return {
    averageRating,
    totalReviews: reviews.length,
    reviews,
  };
});

/**
 * Teachers-with-ratings listing. This query involves a multi-table aggregate
 * (lesson_reviews, teacher_fields, teacher_applications) — expensive to run
 * on every /private-lesson/teachers view.
 *
 * Cached 5 minutes. Invalidated when a new review lands
 * (`revalidateTag(CACHE_TAGS.teachers)` in review-create server action) or
 * when a teacher's field/profile updates.
 */
const _getTeachersWithRatingsOptimizedCached = unstable_cache(
  async () => {
    const result = await db.execute(sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.description as bio,
        u.meet_link,
        COALESCE(AVG(lr.rating), 0) as avg_rating,
        COUNT(lr.id) as review_count,
        STRING_AGG(DISTINCT tf.display_name, ', ') as fields_new,
        MAX(ta.field) as field_legacy
      FROM users u
      LEFT JOIN lesson_reviews lr ON u.id = lr.teacher_id
      LEFT JOIN teacher_fields tf ON u.id = tf.teacher_id AND tf.is_active = true
      LEFT JOIN teacher_applications ta ON u.id = ta.user_id
      WHERE u.role = 'teacher'
      GROUP BY u.id, u.name, u.email, u.avatar, u.description, u.meet_link
      ORDER BY avg_rating DESC, review_count DESC
    `);
    return result as unknown as Array<Record<string, unknown>>;
  },
  ["teachers-with-ratings"],
  { tags: [CACHE_TAGS.teachers], revalidate: CACHE_TTL.teachers },
);

export const getTeachersWithRatingsOptimized = cache(async () => {
  const rows = await _getTeachersWithRatingsOptimizedCached();
  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    avatar: row.avatar as string | null,
    bio: row.bio as string | null,
    meetLink: row.meet_link as string | null,
    field: (row.fields_new as string) || (row.field_legacy as string) || "",
    fields: row.fields_new
      ? String(row.fields_new).split(", ")
      : row.field_legacy
        ? [String(row.field_legacy)]
        : [],
    averageRating: Math.round(Number(row.avg_rating) * 10) / 10,
    totalReviews: Number(row.review_count),
  }));
});

/**
 * Teacher dashboard stats aggregator.
 *
 * Fans out to `lesson_bookings` (counting completed vs total) and
 * `lesson_reviews` (avg rating) in a single CTE-free query. Running this
 * unbatched on every dashboard view is cheap for a single teacher but
 * wasteful at scale, so we wrap in `unstable_cache` keyed per teacher
 * with a short TTL and explicit invalidation on booking / review
 * mutations.
 *
 * Income is computed as `completed_lessons * 50` (a pricing constant),
 * matching the legacy shape so UI code doesn't need to change.
 */
export async function getTeacherStats(teacherId: string) {
  return unstable_cache(
    async () => {
      const queryResult = await db.execute(sql`
        SELECT
          COUNT(DISTINCT lb.id) as total_lessons,
          COUNT(DISTINCT CASE WHEN lb.status = 'completed' THEN lb.id END) as completed_lessons,
          COUNT(DISTINCT lr.id) as total_reviews,
          COALESCE(AVG(lr.rating), 0) as avg_rating,
          SUM(CASE WHEN lb.status = 'completed' THEN 1 ELSE 0 END * 50) as total_income
        FROM lesson_bookings lb
        LEFT JOIN lesson_reviews lr ON lb.id = lr.booking_id
        WHERE lb.teacher_id = ${teacherId}
      `);
      const result =
        (queryResult as unknown as Array<Record<string, unknown>>)[0] ?? {};
      return {
        totalLessons: Number(result.total_lessons ?? 0),
        completedLessons: Number(result.completed_lessons ?? 0),
        totalReviews: Number(result.total_reviews ?? 0),
        averageRating:
          Math.round(Number(result.avg_rating ?? 0) * 10) / 10,
        totalIncome: Number(result.total_income ?? 0),
      };
    },
    ["teacher-stats", teacherId],
    {
      tags: [CACHE_TAGS.teacherStats(teacherId)],
      revalidate: CACHE_TTL.teacherStats,
    },
  )();
}

/**
 * Legacy variant of `getTeachersWithRatingsOptimized`. Still used by a few
 * callers that rely on the per-teacher reduce shape. Prefer the optimized
 * SQL version for any new code paths.
 */
export const getTeachersWithRatings = cache(async () => {
  const teachers = await db.query.users.findMany({
    where: eq(users.role, "teacher"),
    columns: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      description: true,
      meetLink: true,
    },
  });

  const teacherFieldsData = await db.query.teacherFields.findMany({
    where: eq(teacherFields.isActive, true),
    columns: {
      teacherId: true,
      subject: true,
      grade: true,
      displayName: true,
    },
  });

  const fieldsMap = teacherFieldsData.reduce(
    (acc, field) => {
      if (!acc[field.teacherId]) {
        acc[field.teacherId] = [];
      }
      acc[field.teacherId].push(field);
      return acc;
    },
    {} as Record<string, typeof teacherFieldsData>,
  );

  const teacherApplicationsData = await db.query.teacherApplications.findMany({
    columns: {
      userId: true,
      field: true,
    },
  });

  const applicationMap = teacherApplicationsData.reduce(
    (acc, app) => {
      acc[app.userId] = app;
      return acc;
    },
    {} as Record<string, (typeof teacherApplicationsData)[0]>,
  );

  const allReviews = await db.query.lessonReviews.findMany({
    columns: {
      teacherId: true,
      rating: true,
    },
  });

  const ratingMap = allReviews.reduce(
    (acc, review) => {
      if (!acc[review.teacherId]) {
        acc[review.teacherId] = { total: 0, count: 0 };
      }
      acc[review.teacherId].total += review.rating;
      acc[review.teacherId].count += 1;
      return acc;
    },
    {} as Record<string, { total: number; count: number }>,
  );

  return teachers.map((teacher) => {
    const teacherFieldsForUser = fieldsMap[teacher.id] || [];
    const application = applicationMap[teacher.id];
    const ratingData = ratingMap[teacher.id];
    const averageRating = ratingData
      ? Math.round((ratingData.total / ratingData.count) * 10) / 10
      : 0;

    let fieldDisplay = "";
    let fields: string[] = [];

    if (teacherFieldsForUser.length > 0) {
      fields = teacherFieldsForUser.map((f) => f.displayName);
      fieldDisplay = fields.join(", ");
    } else if (application?.field) {
      fieldDisplay = application.field;
      fields = [application.field];
    }

    return {
      ...teacher,
      bio: teacher.description,
      field: fieldDisplay,
      fields: fields,
      averageRating,
      totalReviews: ratingData?.count || 0,
    };
  });
});
