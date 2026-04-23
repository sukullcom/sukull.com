/**
 * Course/unit/lesson/challenge queries powering the learn flow.
 *
 * Hot path: `/learn` renders `getUnits()` + `getCourseProgress()` on every
 * protected page-view. `getCourses` / `getCourseById` are wrapped in
 * `unstable_cache` so admin mutations must bust `CACHE_TAGS.courses`.
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import db from "@/db/drizzle";
import { challengeProgress, courses, lessons, units } from "@/db/schema";
import { getServerUser } from "@/lib/auth";
import { normalizeAvatarUrl } from "@/utils/avatar";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache-tags";
import { getUserProgress } from "./user";

export const getUnits = cache(async () => {
  const user = await getServerUser();
  if (!user) return [];
  const userId = user.id;
  const userProgressData = await getUserProgress();

  if (!userId || !userProgressData?.activeCourseId) {
    return [];
  }

  const data = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, userProgressData.activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          challenges: {
            columns: { id: true, order: true },
            orderBy: (challenges, { asc }) => [asc(challenges.order)],
            with: {
              challengeProgress: {
                columns: { completed: true },
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const normalizedData = data.map((unit) => {
    const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
      const challengeCount = lesson.challenges.length;

      if (challengeCount === 0) {
        return { ...lesson, completed: false, challengeCount };
      }
      const allCompletedChallenges = lesson.challenges.every((challenge) => {
        return (
          challenge.challengeProgress &&
          challenge.challengeProgress.length > 0 &&
          challenge.challengeProgress.every((progress) => progress.completed)
        );
      });

      return { ...lesson, completed: allCompletedChallenges, challengeCount };
    });

    return { ...unit, lessons: lessonsWithCompletedStatus };
  });

  return normalizedData;
});

/**
 * Courses list — cached at the Next.js data-cache layer (cross-request,
 * cross-lambda). `cache()` dedupes within a single request; `unstable_cache`
 * dedupes across all requests until TTL or `revalidateTag(CACHE_TAGS.courses)`.
 *
 * Admin course-builder mutations must call `revalidateTag(CACHE_TAGS.courses)`
 * after any write (see `app/(main)/admin/course-builder/actions.ts`).
 */
const _getCoursesCached = unstable_cache(
  async () => {
    const data = await db.query.courses.findMany();
    return data;
  },
  ["courses-list"],
  { tags: [CACHE_TAGS.courses], revalidate: CACHE_TTL.courses },
);

export const getCourses = cache(async () => {
  const data = await _getCoursesCached();
  return data.map((course) => ({
    ...course,
    imageSrc: normalizeAvatarUrl(course.imageSrc),
  }));
});

/**
 * Course detail with nested units+lessons. Cached per courseId.
 * Called from `/courses/[courseId]` and admin course-builder.
 */
const _getCourseByIdCached = unstable_cache(
  async (courseId: number) => {
    return db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        units: {
          orderBy: (units, { asc }) => [asc(units.order)],
          with: {
            lessons: {
              orderBy: (lessons, { asc }) => [asc(lessons.order)],
            },
          },
        },
      },
    });
  },
  ["course-by-id"],
  { tags: [CACHE_TAGS.courses], revalidate: CACHE_TTL.courses },
);

export const getCourseById = cache(async (courseId: number) => {
  const data = await _getCourseByIdCached(courseId);
  if (!data) return null;
  return {
    ...data,
    imageSrc: normalizeAvatarUrl(data.imageSrc),
  };
});

export const getCourseProgress = cache(async () => {
  const user = await getServerUser();
  if (!user) {
    return null;
  }
  const userId = user.id;

  const userProgressData = await getUserProgress();

  if (!userId || !userProgressData?.activeCourseId) {
    return null;
  }

  const unitsInActiveCourse = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, userProgressData.activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          unit: true,
          challenges: {
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const firstUncompletedLesson = unitsInActiveCourse
    .flatMap((unit) => unit.lessons)
    .find((lesson) => {
      if (lesson.challenges.length === 0) return false;
      return lesson.challenges.some((challenge) => {
        return (
          !challenge.challengeProgress ||
          challenge.challengeProgress.length === 0 ||
          challenge.challengeProgress.some(
            (progress) => progress.completed === false,
          )
        );
      });
    });
  return {
    activeLesson: firstUncompletedLesson,
    activeLessonId: firstUncompletedLesson?.id,
  };
});

export const getLesson = cache(async (id?: number) => {
  const user = await getServerUser();
  if (!user) return null;
  const userId = user.id;

  const courseProgress = await getCourseProgress();

  const lessonId = id || courseProgress?.activeLessonId;

  if (!lessonId) {
    return null;
  }

  const data = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      challenges: {
        orderBy: (challenges, { asc }) => [asc(challenges.order)],
        columns: {
          id: true,
          lessonId: true,
          type: true,
          question: true,
          explanation: true,
          questionImageSrc: true,
          order: true,
          timeLimit: true,
          metadata: true,
          difficulty: true,
          tags: true,
        },
        with: {
          challengeOptions: true,
          challengeProgress: {
            where: eq(challengeProgress.userId, userId),
          },
        },
      },
    },
  });

  if (!data || !data.challenges) {
    return null;
  }

  const normalizedChallenges = data.challenges.map((challenge) => {
    const completed =
      challenge.challengeProgress &&
      challenge.challengeProgress.length > 0 &&
      challenge.challengeProgress.every((progress) => progress.completed);

    return { ...challenge, completed };
  });

  return { ...data, challenges: normalizedChallenges };
});

export const getLessonPercentage = cache(async () => {
  const courseProgress = await getCourseProgress();

  if (!courseProgress?.activeLessonId) {
    return 0;
  }

  const lesson = await getLesson(courseProgress.activeLessonId);

  if (!lesson) {
    return 0;
  }

  const completedChallenges = lesson.challenges.filter(
    (challenge) => challenge.completed,
  );
  const percentage = Math.round(
    (completedChallenges.length / lesson.challenges.length) * 100,
  );

  return percentage;
});
