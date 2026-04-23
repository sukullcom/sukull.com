"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import db from "@/db/drizzle";
import { courses, units, lessons, challenges, challengeOptions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAdminActor } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { logger } from "@/lib/logger";

const log = logger.child({ labels: { module: "admin/course-builder" } });

type ChallengeOptionInsert = typeof challengeOptions.$inferInsert;

async function requireAdmin(): Promise<{ id: string; email: string | null }> {
  const actor = await getAdminActor();
  if (!actor) throw new Error("Bu işlem için yetkiniz yok.");
  return actor;
}

/**
 * Invalidate both the admin ISR path AND the Next data-cache tag for courses.
 * Called after every course-builder mutation so:
 *   • `/admin/course-builder` re-renders with fresh admin-facing data
 *   • `getCourses()` / `getCourseById()` across the whole app see new state
 *     on the next request (without waiting for the 6h TTL)
 */
function invalidateCourseCaches() {
  revalidatePath("/admin/course-builder");
  revalidateTag(CACHE_TAGS.courses);
}

// Course Actions
export async function createCourse(data: { title: string; imageSrc: string }) {
  try {
    const actor = await requireAdmin();
    const [course] = await db
      .insert(courses)
      .values({
        title: data.title,
        imageSrc: data.imageSrc,
      })
      .returning();

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "course.create",
      targetType: "course",
      targetId: course?.id,
      metadata: { title: data.title },
    });

    invalidateCourseCaches();
    return { success: true, course };
  } catch (error) {
    log.error({ message: "createCourse failed", error, location: "createCourse", fields: { title: data.title } });
    return { success: false, error: `Failed to create course: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateCourse(courseId: number, data: { title: string; imageSrc: string }) {
  try {
    const actor = await requireAdmin();
    const [course] = await db
      .update(courses)
      .set({
        title: data.title,
        imageSrc: data.imageSrc,
      })
      .where(eq(courses.id, courseId))
      .returning();

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "course.update",
      targetType: "course",
      targetId: courseId,
      metadata: { title: data.title },
    });

    invalidateCourseCaches();
    return { success: true, course };
  } catch (error) {
    log.error({ message: "updateCourse failed", error, location: "updateCourse", fields: { courseId } });
    return { success: false, error: `Failed to update course: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteCourse(courseId: number) {
  try {
    const actor = await requireAdmin();
    await db.delete(courses).where(eq(courses.id, courseId));
    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "course.delete",
      targetType: "course",
      targetId: courseId,
    });
    invalidateCourseCaches();
    return { success: true };
  } catch (error) {
    log.error({ message: "deleteCourse failed", error, location: "deleteCourse", fields: { courseId } });
    return { success: false, error: "Failed to delete course" };
  }
}

// Unit Actions
export async function createUnit(data: { 
  courseId: number; 
  title: string; 
  description: string; 
  order: number; 
}) {
  try {
    const actor = await requireAdmin();
    const [unit] = await db
      .insert(units)
      .values(data)
      .returning();

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "unit.create",
      targetType: "unit",
      targetId: unit?.id,
      metadata: { courseId: data.courseId, title: data.title },
    });

    invalidateCourseCaches();
    return { success: true, unit };
  } catch (error) {
    log.error({ message: "createUnit failed", error, location: "createUnit", fields: { courseId: data.courseId, title: data.title } });
    return { success: false, error: `Failed to create unit: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateUnit(unitId: number, data: { 
  title: string; 
  description: string; 
  order: number; 
}) {
  try {
    const actor = await requireAdmin();
    const [unit] = await db
      .update(units)
      .set({
        title: data.title,
        description: data.description,
        order: data.order,
      })
      .where(eq(units.id, unitId))
      .returning();

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "unit.update",
      targetType: "unit",
      targetId: unitId,
      metadata: { title: data.title },
    });

    invalidateCourseCaches();
    return { success: true, unit };
  } catch (error) {
    log.error({ message: "updateUnit failed", error, location: "updateUnit", fields: { unitId } });
    return { success: false, error: `Failed to update unit: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteUnit(unitId: number) {
  try {
    const actor = await requireAdmin();
    await db.delete(units).where(eq(units.id, unitId));
    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "unit.delete",
      targetType: "unit",
      targetId: unitId,
    });
    invalidateCourseCaches();
    return { success: true };
  } catch (error) {
    log.error({ message: "deleteUnit failed", error, location: "deleteUnit", fields: { unitId } });
    return { success: false, error: "Failed to delete unit" };
  }
}

// Lesson Actions
export async function createLesson(data: { 
  unitId: number; 
  title: string; 
  order: number; 
}) {
  try {
    const actor = await requireAdmin();
    const [lesson] = await db
      .insert(lessons)
      .values(data)
      .returning();

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "lesson.create",
      targetType: "lesson",
      targetId: lesson?.id,
      metadata: { unitId: data.unitId, title: data.title },
    });

    invalidateCourseCaches();
    return { success: true, lesson };
  } catch (error) {
    log.error({ message: "createLesson failed", error, location: "createLesson", fields: { unitId: data.unitId, title: data.title } });
    return { success: false, error: `Failed to create lesson: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateLesson(lessonId: number, data: { 
  title: string; 
  order: number; 
}) {
  try {
    const actor = await requireAdmin();
    const [lesson] = await db
      .update(lessons)
      .set({
        title: data.title,
        order: data.order,
      })
      .where(eq(lessons.id, lessonId))
      .returning();

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "lesson.update",
      targetType: "lesson",
      targetId: lessonId,
      metadata: { title: data.title },
    });

    invalidateCourseCaches();
    return { success: true, lesson };
  } catch (error) {
    log.error({ message: "updateLesson failed", error, location: "updateLesson", fields: { lessonId } });
    return { success: false, error: `Failed to update lesson: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteLesson(lessonId: number) {
  try {
    const actor = await requireAdmin();
    await db.delete(lessons).where(eq(lessons.id, lessonId));
    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "lesson.delete",
      targetType: "lesson",
      targetId: lessonId,
    });
    invalidateCourseCaches();
    return { success: true };
  } catch (error) {
    log.error({ message: "deleteLesson failed", error, location: "deleteLesson", fields: { lessonId } });
    return { success: false, error: "Failed to delete lesson" };
  }
}

// Challenge Actions
export async function createChallenge(data: {
  lessonId: number;
  type: string;
  question: string;
  explanation?: string;
  order: number;
  difficulty?: string;
  tags?: string;
  timeLimit?: number;
  metadata?: string;
  questionImageSrc?: string;
}) {
  try {
    const actor = await requireAdmin();
    const [challenge] = await db
      .insert(challenges)
      .values({
        lessonId: data.lessonId,
        type: data.type as "SELECT" | "ASSIST" | "DRAG_DROP" | "FILL_BLANK" | "MATCH_PAIRS" | "SEQUENCE" | "TIMER_CHALLENGE",
        question: data.question,
        explanation: data.explanation,
        questionImageSrc: data.questionImageSrc,
        order: data.order,
        difficulty: data.difficulty as "EASY" | "MEDIUM" | "HARD" | undefined,
        tags: data.tags || undefined,
        timeLimit: data.timeLimit,
        metadata: data.metadata,
      })
      .returning();

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "challenge.create",
      targetType: "challenge",
      targetId: challenge?.id,
      metadata: { lessonId: data.lessonId, type: data.type },
    });

    invalidateCourseCaches();
    return { success: true, challenge };
  } catch (error) {
    log.error({ message: "createChallenge failed", error, location: "createChallenge", fields: { lessonId: data.lessonId, type: data.type } });
    return { success: false, error: `Failed to create challenge: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateChallenge(challengeId: number, data: {
  lessonId?: number;
  type: string;
  question: string;
  explanation?: string;
  order: number;
  difficulty?: string;
  tags?: string;
  timeLimit?: number;
  metadata?: string;
  questionImageSrc?: string;
}) {
  try {
    const actor = await requireAdmin();
    const [challenge] = await db
      .update(challenges)
      .set({
        ...(data.lessonId && { lessonId: data.lessonId }),
        type: data.type as "SELECT" | "ASSIST" | "DRAG_DROP" | "FILL_BLANK" | "MATCH_PAIRS" | "SEQUENCE" | "TIMER_CHALLENGE",
        question: data.question,
        explanation: data.explanation,
        questionImageSrc: data.questionImageSrc,
        order: data.order,
        difficulty: data.difficulty as "EASY" | "MEDIUM" | "HARD" | undefined,
        tags: data.tags || undefined,
        timeLimit: data.timeLimit,
        metadata: data.metadata,
      })
      .where(eq(challenges.id, challengeId))
      .returning();

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "challenge.update",
      targetType: "challenge",
      targetId: challengeId,
      metadata: { type: data.type },
    });

    invalidateCourseCaches();
    return { success: true, challenge };
  } catch (error) {
    log.error({ message: "updateChallenge failed", error, location: "updateChallenge", fields: { challengeId } });
    return { success: false, error: `Failed to update challenge: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteChallenge(challengeId: number) {
  try {
    const actor = await requireAdmin();
    await db.delete(challenges).where(eq(challenges.id, challengeId));
    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "challenge.delete",
      targetType: "challenge",
      targetId: challengeId,
    });
    invalidateCourseCaches();
    return { success: true };
  } catch (error) {
    log.error({ message: "deleteChallenge failed", error, location: "deleteChallenge", fields: { challengeId } });
    return { success: false, error: "Failed to delete challenge" };
  }
}

export async function cloneChallenge(challengeId: number, targetLessonId?: number) {
  try {
    await requireAdmin();
    const original = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId),
      with: { challengeOptions: true },
    });

    if (!original) {
      return { success: false, error: "Challenge not found" };
    }

    const siblingCount = await db.query.challenges.findMany({
      where: eq(challenges.lessonId, targetLessonId ?? original.lessonId),
      columns: { id: true },
    });

    const [cloned] = await db
      .insert(challenges)
      .values({
        lessonId: targetLessonId ?? original.lessonId,
        type: original.type,
        question: original.question,
        explanation: original.explanation,
        questionImageSrc: original.questionImageSrc,
        order: siblingCount.length + 1,
        difficulty: original.difficulty,
        tags: original.tags,
        timeLimit: original.timeLimit,
        metadata: original.metadata,
      })
      .returning();

    if (original.challengeOptions && original.challengeOptions.length > 0) {
      await db.insert(challengeOptions).values(
        original.challengeOptions.map((opt) => ({
          challengeId: cloned.id,
          text: opt.text,
          correct: opt.correct,
          imageSrc: opt.imageSrc,
          audioSrc: opt.audioSrc,
          correctOrder: opt.correctOrder,
          pairId: opt.pairId,
          isBlank: opt.isBlank,
          dragData: opt.dragData,
        }))
      );
    }

    invalidateCourseCaches();
    return { success: true, challenge: cloned };
  } catch (error) {
    log.error({ message: "cloneChallenge failed", error, location: "cloneChallenge" });
    return { success: false, error: `Failed to clone challenge: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Challenge Option Actions
export async function createChallengeOptions(
  challengeId: number,
  options: Array<{
    text?: string; // Make text optional
    correct: boolean;
    imageSrc?: string;
    audioSrc?: string;
    correctOrder?: number;
    pairId?: number;
    isBlank?: boolean;
    dragData?: string;
  }>
) {
  try {
    await requireAdmin();
    const challengeOptionsData: ChallengeOptionInsert[] = options.map((option) => ({
      challengeId,
      text: option.text ?? "",
      correct: option.correct,
      imageSrc: option.imageSrc,
      audioSrc: option.audioSrc,
      correctOrder: option.correctOrder,
      pairId: option.pairId,
      isBlank: option.isBlank,
      dragData: option.dragData,
    }));

    const createdOptions = await db
      .insert(challengeOptions)
      .values(challengeOptionsData)
      .returning();

    invalidateCourseCaches();
    return { success: true, options: createdOptions };
  } catch (error) {
    log.error({ message: "createChallengeOptions failed", error, location: "createChallengeOptions", fields: { challengeId } });
    return { success: false, error: `Failed to create challenge options: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateChallengeOptions(
  challengeId: number,
  options: Array<{
    id?: number;
    text?: string; // Make text optional
    correct: boolean;
    imageSrc?: string;
    audioSrc?: string;
    correctOrder?: number;
    pairId?: number;
    isBlank?: boolean;
    dragData?: string;
  }>
) {
  try {
    await requireAdmin();
    // Delete existing options for this challenge
    await db.delete(challengeOptions).where(eq(challengeOptions.challengeId, challengeId));

    const challengeOptionsData: ChallengeOptionInsert[] = options.map((option) => ({
      challengeId,
      text: option.text ?? "",
      correct: option.correct,
      imageSrc: option.imageSrc,
      audioSrc: option.audioSrc,
      correctOrder: option.correctOrder,
      pairId: option.pairId,
      isBlank: option.isBlank,
      dragData: option.dragData,
    }));

    const createdOptions = await db
      .insert(challengeOptions)
      .values(challengeOptionsData)
      .returning();

    invalidateCourseCaches();
    return { success: true, options: createdOptions };
  } catch (error) {
    log.error({ message: "updateChallengeOptions failed", error, location: "updateChallengeOptions", fields: { challengeId } });
    return { success: false, error: `Failed to update challenge options: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteChallengeOption(optionId: number) {
  try {
    await requireAdmin();
    await db.delete(challengeOptions).where(eq(challengeOptions.id, optionId));
    invalidateCourseCaches();
    return { success: true };
  } catch (error) {
    log.error({ message: "deleteChallengeOption failed", error, location: "deleteChallengeOption" });
    return { success: false, error: "Failed to delete challenge option" };
  }
}

// Import Course from JSON
export async function importCourseFromJSON(jsonData: {
  course: { title: string; imageSrc?: string };
  units: Array<{
    title: string;
    description: string;
    order: number;
    lessons: Array<{
      title: string;
      order: number;
      challenges: Array<{
        question: string;
        type: string;
        difficulty?: string;
        tags?: string;
        explanation?: string;
        timeLimit?: number;
        metadata?: string;
        questionImageSrc?: string;
        options: Array<{
          text?: string;
          correct: boolean;
          imageSrc?: string;
          audioSrc?: string;
          correctOrder?: number;
          sequenceOrder?: number;
          pairId?: number;
          isBlank?: boolean;
          dragData?: string;
        }>;
      }>;
    }>;
  }>;
}) {
  try {
    await requireAdmin();
    const [course] = await db
      .insert(courses)
      .values({
        title: jsonData.course.title,
        imageSrc: jsonData.course.imageSrc || "/courses/default.svg",
      })
      .returning();

    let totalUnits = 0;
    let totalLessons = 0;
    let totalChallenges = 0;

    for (const unitData of jsonData.units) {
      const [unit] = await db
        .insert(units)
        .values({
          courseId: course.id,
          title: unitData.title,
          description: unitData.description,
          order: unitData.order,
        })
        .returning();
      totalUnits++;

      for (const lessonData of unitData.lessons) {
        const [lesson] = await db
          .insert(lessons)
          .values({
            unitId: unit.id,
            title: lessonData.title,
            order: lessonData.order,
          })
          .returning();
        totalLessons++;

        for (const challengeData of lessonData.challenges) {
          const [challenge] = await db
            .insert(challenges)
            .values({
              lessonId: lesson.id,
              type: challengeData.type as "SELECT" | "ASSIST" | "DRAG_DROP" | "FILL_BLANK" | "MATCH_PAIRS" | "SEQUENCE" | "TIMER_CHALLENGE",
              question: challengeData.question,
              explanation: challengeData.explanation,
              questionImageSrc: challengeData.questionImageSrc,
              order: challengeData.options ? totalChallenges + 1 : 1,
              difficulty: challengeData.difficulty as "EASY" | "MEDIUM" | "HARD" | undefined,
              tags: challengeData.tags,
              timeLimit: challengeData.timeLimit,
              metadata: challengeData.metadata,
            })
            .returning();
          totalChallenges++;

          if (challengeData.options && challengeData.options.length > 0) {
            const rows: ChallengeOptionInsert[] = challengeData.options.map((opt) => ({
              challengeId: challenge.id,
              text: opt.text ?? "",
              correct: opt.correct,
              imageSrc: opt.imageSrc,
              audioSrc: opt.audioSrc,
              correctOrder: opt.correctOrder ?? opt.sequenceOrder,
              pairId: opt.pairId,
              isBlank: opt.isBlank,
              dragData: opt.dragData,
            }));
            await db.insert(challengeOptions).values(rows);
          }
        }
      }
    }

    invalidateCourseCaches();
    return {
      success: true,
      course,
      stats: { units: totalUnits, lessons: totalLessons, challenges: totalChallenges },
    };
  } catch (error) {
    log.error({ message: "importCourse failed", error, location: "importCourse" });
    return { success: false, error: `Import failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Append/Merge content into an existing course from JSON
// - Units matched by title → if exists, use it; if not, create new
// - Lessons matched by title within unit → if exists, append challenges; if not, create new
// - Challenges are always added (never replaced) to preserve user progress
export async function appendToCourse(
  courseId: number,
  jsonData: {
    units: Array<{
      title: string;
      description: string;
      order?: number;
      lessons: Array<{
        title: string;
        order?: number;
        challenges: Array<{
          question: string;
          type: string;
          difficulty?: string;
          tags?: string;
          explanation?: string;
          timeLimit?: number;
          metadata?: string;
          questionImageSrc?: string;
          options: Array<{
            text?: string;
            correct: boolean;
            imageSrc?: string;
            audioSrc?: string;
            correctOrder?: number;
            sequenceOrder?: number;
            pairId?: number;
            isBlank?: boolean;
            dragData?: string;
          }>;
        }>;
      }>;
    }>;
  }
) {
  try {
    await requireAdmin();
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });
    if (!existingCourse) {
      return { success: false, error: "Kurs bulunamadı (ID: " + courseId + ")" };
    }

    const existingUnits = await db.query.units.findMany({
      where: eq(units.courseId, courseId),
      orderBy: (u, { desc }) => [desc(u.order)],
    });
    const unitByTitle = new Map(existingUnits.map((u) => [u.title.trim().toLowerCase(), u]));
    let maxUnitOrder = existingUnits.length > 0 ? existingUnits[0].order : 0;

    let addedUnits = 0;
    let addedLessons = 0;
    let addedChallenges = 0;
    let skippedLessons = 0;

    for (const unitData of jsonData.units) {
      const unitKey = unitData.title.trim().toLowerCase();
      let unit = unitByTitle.get(unitKey);

      if (!unit) {
        maxUnitOrder++;
        const [newUnit] = await db
          .insert(units)
          .values({
            courseId,
            title: unitData.title,
            description: unitData.description,
            order: unitData.order ?? maxUnitOrder,
          })
          .returning();
        unit = newUnit;
        addedUnits++;
      }

      const existingLessons = await db.query.lessons.findMany({
        where: eq(lessons.unitId, unit.id),
        orderBy: (l, { desc }) => [desc(l.order)],
      });
      const lessonByTitle = new Map(
        existingLessons.map((l) => [l.title.trim().toLowerCase(), l])
      );
      let maxLessonOrder = existingLessons.length > 0 ? existingLessons[0].order : 0;

      for (const lessonData of unitData.lessons) {
        const lessonKey = lessonData.title.trim().toLowerCase();
        let lesson = lessonByTitle.get(lessonKey);

        if (!lesson) {
          maxLessonOrder++;
          const [newLesson] = await db
            .insert(lessons)
            .values({
              unitId: unit.id,
              title: lessonData.title,
              order: lessonData.order ?? maxLessonOrder,
            })
            .returning();
          lesson = newLesson;
          addedLessons++;
        } else {
          skippedLessons++;
        }

        const maxOrderResult = await db
          .select({ maxOrder: sql<number>`COALESCE(MAX(${challenges.order}), 0)` })
          .from(challenges)
          .where(eq(challenges.lessonId, lesson.id));
        let challengeOrder = maxOrderResult[0]?.maxOrder ?? 0;

        for (const chData of lessonData.challenges) {
          challengeOrder++;
          const [challenge] = await db
            .insert(challenges)
            .values({
              lessonId: lesson.id,
              type: chData.type as "SELECT" | "ASSIST" | "DRAG_DROP" | "FILL_BLANK" | "MATCH_PAIRS" | "SEQUENCE" | "TIMER_CHALLENGE",
              question: chData.question,
              explanation: chData.explanation,
              questionImageSrc: chData.questionImageSrc,
              order: challengeOrder,
              difficulty: chData.difficulty as "EASY" | "MEDIUM" | "HARD" | undefined,
              tags: chData.tags,
              timeLimit: chData.timeLimit,
              metadata: chData.metadata,
            })
            .returning();
          addedChallenges++;

          if (chData.options && chData.options.length > 0) {
            const rows: ChallengeOptionInsert[] = chData.options.map((opt) => ({
              challengeId: challenge.id,
              text: opt.text ?? "",
              correct: opt.correct,
              imageSrc: opt.imageSrc,
              audioSrc: opt.audioSrc,
              correctOrder: opt.correctOrder ?? opt.sequenceOrder,
              pairId: opt.pairId,
              isBlank: opt.isBlank,
              dragData: opt.dragData,
            }));
            await db.insert(challengeOptions).values(rows);
          }
        }
      }
    }

    invalidateCourseCaches();
    return {
      success: true,
      stats: {
        addedUnits,
        addedLessons,
        addedChallenges,
        skippedLessons,
      },
    };
  } catch (error) {
    log.error({ message: "appendToCourse failed", error, location: "appendToCourse" });
    return {
      success: false,
      error: `İçerik ekleme hatası: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Get Units for Course
export async function getUnitsForCourse(courseId: number) {
  try {
    await requireAdmin();
    const courseUnits = await db.query.units.findMany({
      where: eq(units.courseId, courseId),
      orderBy: (units, { asc }) => [asc(units.order)],
    });

    return { success: true, units: courseUnits };
  } catch (error) {
    log.error({ message: "fetch units failed", error, location: "getUnitsForCourse", fields: { courseId } });
    return { success: false, error: `Failed to fetch units: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Get Lessons for Course
export async function getLessonsForCourse(courseId: number) {
  try {
    await requireAdmin();
    // First get the units for this course
    const courseUnits = await db
      .select({ id: units.id })
      .from(units)
      .where(eq(units.courseId, courseId));

    if (courseUnits.length === 0) {
      return { success: true, lessons: [] };
    }

    const unitIds = courseUnits.map(unit => unit.id);

    // Then get lessons for those units
    const courseLessons = await db.query.lessons.findMany({
      where: (lessons, { inArray }) => inArray(lessons.unitId, unitIds),
      with: {
        unit: true,
      },
      orderBy: (lessons, { asc }) => [asc(lessons.order)],
    });

    return { success: true, lessons: courseLessons };
  } catch (error) {
    log.error({ message: "fetch lessons failed", error, location: "getLessonsForCourse", fields: { courseId } });
    return { success: false, error: `Failed to fetch lessons: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Get Challenges for Course (kept for compatibility, but will be replaced by lesson-based loading)
export async function getChallengesForCourse(courseId: number) {
  try {
    await requireAdmin();
    // First get lesson IDs for this course
    const courseLessons = await db
      .select({ id: lessons.id })
      .from(lessons)
      .innerJoin(units, eq(lessons.unitId, units.id))
      .where(eq(units.courseId, courseId));

    if (courseLessons.length === 0) {
      return { success: true, challenges: [] };
    }

    const lessonIds = courseLessons.map(lesson => lesson.id);

    // Then get challenges for those lessons
    const courseChallenges = await db.query.challenges.findMany({
      where: (challenges, { inArray }) => inArray(challenges.lessonId, lessonIds),
      with: {
        lesson: {
          with: {
            unit: true,
          },
        },
        challengeOptions: true,
      },
      orderBy: (challenges, { asc }) => [asc(challenges.order)],
    });

    return { success: true, challenges: courseChallenges };
  } catch (error) {
    log.error({ message: "fetch challenges (course) failed", error, location: "getChallengesForCourse", fields: { courseId } });
    return { success: false, error: `Failed to fetch challenges: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// 🚀 NEW: Get Challenges for Specific Lesson (Performance Optimized)
export async function getChallengesForLesson(lessonId: number) {
  try {
    await requireAdmin();
    const lessonChallenges = await db.query.challenges.findMany({
      where: (challenges, { eq }) => eq(challenges.lessonId, lessonId),
      with: {
        lesson: {
          with: {
            unit: true,
          },
        },
        challengeOptions: true,
      },
      orderBy: (challenges, { asc }) => [asc(challenges.order)],
    });

    return { success: true, challenges: lessonChallenges };
  } catch (error) {
    log.error({ message: "fetch challenges (lesson) failed", error, location: "getChallengesForLesson", fields: { lessonId } });
    return { success: false, error: `Failed to fetch challenges: ${error instanceof Error ? error.message : String(error)}` };
  }
} 