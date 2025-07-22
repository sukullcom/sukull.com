"use server";

import { revalidatePath } from "next/cache";
import db from "@/db/drizzle";
import { courses, units, lessons, challenges, challengeOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Course Actions
export async function createCourse(data: { title: string; imageSrc: string }) {
  try {
    const [course] = await db
      .insert(courses)
      .values({
        title: data.title,
        imageSrc: data.imageSrc,
      })
      .returning();

    revalidatePath("/admin/course-builder");
    return { success: true, course };
  } catch (error) {
    console.error("Error creating course:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to create course: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateCourse(courseId: number, data: { title: string; imageSrc: string }) {
  try {
    const [course] = await db
      .update(courses)
      .set({
        title: data.title,
        imageSrc: data.imageSrc,
      })
      .where(eq(courses.id, courseId))
      .returning();

    revalidatePath("/admin/course-builder");
    return { success: true, course };
  } catch (error) {
    console.error("Error updating course:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to update course: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteCourse(courseId: number) {
  try {
    await db.delete(courses).where(eq(courses.id, courseId));
    revalidatePath("/admin/course-builder");
    return { success: true };
  } catch (error) {
    console.error("Error deleting course:", error);
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
    const [unit] = await db
      .insert(units)
      .values(data)
      .returning();

    revalidatePath("/admin/course-builder");
    return { success: true, unit };
  } catch (error) {
    console.error("Error creating unit:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to create unit: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateUnit(unitId: number, data: { 
  title: string; 
  description: string; 
  order: number; 
}) {
  try {
    const [unit] = await db
      .update(units)
      .set({
        title: data.title,
        description: data.description,
        order: data.order,
      })
      .where(eq(units.id, unitId))
      .returning();

    revalidatePath("/admin/course-builder");
    return { success: true, unit };
  } catch (error) {
    console.error("Error updating unit:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to update unit: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteUnit(unitId: number) {
  try {
    await db.delete(units).where(eq(units.id, unitId));
    revalidatePath("/admin/course-builder");
    return { success: true };
  } catch (error) {
    console.error("Error deleting unit:", error);
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
    const [lesson] = await db
      .insert(lessons)
      .values(data)
      .returning();

    revalidatePath("/admin/course-builder");
    return { success: true, lesson };
  } catch (error) {
    console.error("Error creating lesson:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to create lesson: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateLesson(lessonId: number, data: { 
  title: string; 
  order: number; 
}) {
  try {
    const [lesson] = await db
      .update(lessons)
      .set({
        title: data.title,
        order: data.order,
      })
      .where(eq(lessons.id, lessonId))
      .returning();

    revalidatePath("/admin/course-builder");
    return { success: true, lesson };
  } catch (error) {
    console.error("Error updating lesson:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to update lesson: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteLesson(lessonId: number) {
  try {
    await db.delete(lessons).where(eq(lessons.id, lessonId));
    revalidatePath("/admin/course-builder");
    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
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
  timeLimit?: number;
  metadata?: string;
  questionImageSrc?: string;
}) {
  try {
    const [challenge] = await db
      .insert(challenges)
      .values({
        lessonId: data.lessonId,
        type: data.type as "SELECT" | "ASSIST" | "DRAG_DROP" | "FILL_BLANK" | "MATCH_PAIRS" | "SEQUENCE" | "TIMER_CHALLENGE",
        question: data.question,
        explanation: data.explanation,
        questionImageSrc: data.questionImageSrc,
        order: data.order,
        timeLimit: data.timeLimit,
        metadata: data.metadata,
      })
      .returning();

    revalidatePath("/admin/course-builder");
    return { success: true, challenge };
  } catch (error) {
    console.error("Error creating challenge:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to create challenge: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateChallenge(challengeId: number, data: {
  type: string;
  question: string;
  explanation?: string;
  order: number;
  timeLimit?: number;
  metadata?: string;
  questionImageSrc?: string;
}) {
  try {
    const [challenge] = await db
      .update(challenges)
      .set({
        type: data.type as "SELECT" | "ASSIST" | "DRAG_DROP" | "FILL_BLANK" | "MATCH_PAIRS" | "SEQUENCE" | "TIMER_CHALLENGE",
        question: data.question,
        explanation: data.explanation,
        questionImageSrc: data.questionImageSrc,
        order: data.order,
        timeLimit: data.timeLimit,
        metadata: data.metadata,
      })
      .where(eq(challenges.id, challengeId))
      .returning();

    revalidatePath("/admin/course-builder");
    return { success: true, challenge };
  } catch (error) {
    console.error("Error updating challenge:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to update challenge: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteChallenge(challengeId: number) {
  try {
    await db.delete(challenges).where(eq(challenges.id, challengeId));
    revalidatePath("/admin/course-builder");
    return { success: true };
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return { success: false, error: "Failed to delete challenge" };
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
    const challengeOptionsData = options.map(option => ({
      challengeId,
      ...option,
    }));

    const createdOptions = await db
      .insert(challengeOptions)
      .values(challengeOptionsData)
      .returning();

    revalidatePath("/admin/course-builder");
    return { success: true, options: createdOptions };
  } catch (error) {
    console.error("Error creating challenge options for challenge", challengeId, ":", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
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
    // Delete existing options for this challenge
    await db.delete(challengeOptions).where(eq(challengeOptions.challengeId, challengeId));

    // Insert new options
    const challengeOptionsData = options.map(option => ({
      challengeId,
      text: option.text,
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

    revalidatePath("/admin/course-builder");
    return { success: true, options: createdOptions };
  } catch (error) {
    console.error("Error updating challenge options for challenge", challengeId, ":", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to update challenge options: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteChallengeOption(optionId: number) {
  try {
    await db.delete(challengeOptions).where(eq(challengeOptions.id, optionId));
    revalidatePath("/admin/course-builder");
    return { success: true };
  } catch (error) {
    console.error("Error deleting challenge option:", error);
    return { success: false, error: "Failed to delete challenge option" };
  }
}

// Get Units for Course
export async function getUnitsForCourse(courseId: number) {
  try {
    const courseUnits = await db.query.units.findMany({
      where: eq(units.courseId, courseId),
      orderBy: (units, { asc }) => [asc(units.order)],
    });

    return { success: true, units: courseUnits };
  } catch (error) {
    console.error("Error fetching units for course", courseId, ":", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to fetch units: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Get Lessons for Course
export async function getLessonsForCourse(courseId: number) {
  try {
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
    console.error("Error fetching lessons for course", courseId, ":", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to fetch lessons: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Get Challenges for Course (kept for compatibility, but will be replaced by lesson-based loading)
export async function getChallengesForCourse(courseId: number) {
  try {
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
    console.error("Error fetching challenges for course", courseId, ":", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to fetch challenges: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// 🚀 NEW: Get Challenges for Specific Lesson (Performance Optimized)
export async function getChallengesForLesson(lessonId: number) {
  try {
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
    console.error("Error fetching challenges for lesson", lessonId, ":", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { success: false, error: `Failed to fetch challenges: ${error instanceof Error ? error.message : String(error)}` };
  }
} 