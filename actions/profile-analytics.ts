"use server";

import db from "@/db/drizzle";
import {
  challengeProgress,
  challenges,
  lessons,
  units,
  courses,
  userProgress,
  users,
} from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";

export interface CourseAnalytics {
  courseId: number;
  courseTitle: string;
  courseImageSrc: string;
  totalChallenges: number;
  completedChallenges: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
}

export interface SubjectAnalytics {
  subject: string;
  totalChallenges: number;
  completedChallenges: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
}

export interface DifficultyAnalytics {
  difficulty: string;
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}

export interface ChallengeTypeAnalytics {
  type: string;
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}

export interface ProfileAnalyticsData {
  courseAnalytics: CourseAnalytics[];
  subjectAnalytics: SubjectAnalytics[];
  difficultyAnalytics: DifficultyAnalytics[];
  typeAnalytics: ChallengeTypeAnalytics[];
  summary: {
    totalPoints: number;
    totalCoursesStarted: number;
    totalCoursesCompleted: number;
    totalChallengesCompleted: number;
    totalCorrect: number;
    totalIncorrect: number;
    overallAccuracy: number;
    daysActive: number;
    currentStreak: number;
  };
}

function detectSubject(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("matematik")) return "Matematik";
  if (t.includes("türkçe") || t.includes("türk dili") || t.includes("edebiyat")) return "Türkçe";
  if (t.includes("fen bilimleri")) return "Fen Bilimleri";
  if (t.includes("fizik")) return "Fizik";
  if (t.includes("kimya")) return "Kimya";
  if (t.includes("biyoloji")) return "Biyoloji";
  if (t.includes("tarih")) return "Tarih";
  if (t.includes("coğrafya")) return "Coğrafya";
  if (t.includes("ingilizce") || t.includes("english")) return "İngilizce";
  return "Diğer";
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

const TYPE_LABELS: Record<string, string> = {
  SELECT: "Çoktan Seçmeli",
  FILL_BLANK: "Boşluk Doldurma",
  MATCH_PAIRS: "Eşleştirme",
  SEQUENCE: "Sıralama",
  DRAG_DROP: "Sürükle Bırak",
};

export async function getProfileAnalytics(): Promise<ProfileAnalyticsData | null> {
  try {
    const user = await getServerUser();
    if (!user) return null;
    const userId = user.id;

    const [userProgressRows, totalsByCourse, upRow, userRow] = await Promise.all([
      db
        .select({
          courseId: courses.id,
          courseTitle: courses.title,
          courseImageSrc: courses.imageSrc,
          completed: challengeProgress.completed,
          correctCount: challengeProgress.correctCount,
          incorrectCount: challengeProgress.incorrectCount,
          challengeType: challenges.type,
          difficulty: challenges.difficulty,
        })
        .from(challengeProgress)
        .innerJoin(challenges, eq(challengeProgress.challengeId, challenges.id))
        .innerJoin(lessons, eq(challenges.lessonId, lessons.id))
        .innerJoin(units, eq(lessons.unitId, units.id))
        .innerJoin(courses, eq(units.courseId, courses.id))
        .where(eq(challengeProgress.userId, userId)),

      db
        .select({
          courseId: courses.id,
          courseTitle: courses.title,
          courseImageSrc: courses.imageSrc,
          totalChallenges: count(challenges.id),
        })
        .from(courses)
        .innerJoin(units, eq(units.courseId, courses.id))
        .innerJoin(lessons, eq(lessons.unitId, units.id))
        .innerJoin(challenges, eq(challenges.lessonId, lessons.id))
        .groupBy(courses.id, courses.title, courses.imageSrc),

      db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
        columns: { points: true, istikrar: true },
      }),

      db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { created_at: true },
      }),
    ]);

    const points = upRow?.points ?? 0;
    const currentStreak = upRow?.istikrar ?? 0;
    const createdAt = userRow?.created_at;
    const daysActive = createdAt
      ? Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

    const totalsMap = new Map<number, { title: string; imageSrc: string; total: number }>();
    for (const row of totalsByCourse) {
      totalsMap.set(row.courseId, {
        title: row.courseTitle,
        imageSrc: row.courseImageSrc,
        total: Number(row.totalChallenges),
      });
    }

    const courseMap = new Map<number, {
      completed: number;
      correct: number;
      incorrect: number;
    }>();
    const diffMap = new Map<string, { total: number; correct: number; incorrect: number }>();
    const typeMap = new Map<string, { total: number; correct: number; incorrect: number }>();

    let totalCompleted = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;

    for (const row of userProgressRows) {
      const cm = courseMap.get(row.courseId) || { completed: 0, correct: 0, incorrect: 0 };
      if (row.completed) cm.completed++;
      cm.correct += row.correctCount;
      cm.incorrect += row.incorrectCount;
      courseMap.set(row.courseId, cm);

      if (row.completed) totalCompleted++;
      totalCorrect += row.correctCount;
      totalIncorrect += row.incorrectCount;

      const diff = row.difficulty || "medium";
      const dm = diffMap.get(diff) || { total: 0, correct: 0, incorrect: 0 };
      dm.total++;
      dm.correct += row.correctCount;
      dm.incorrect += row.incorrectCount;
      diffMap.set(diff, dm);

      const type = row.challengeType || "SELECT";
      const tm = typeMap.get(type) || { total: 0, correct: 0, incorrect: 0 };
      tm.total++;
      tm.correct += row.correctCount;
      tm.incorrect += row.incorrectCount;
      typeMap.set(type, tm);
    }

    const courseAnalytics: CourseAnalytics[] = [];
    const subjectMap = new Map<string, { total: number; completed: number; correct: number; incorrect: number }>();
    const coursesStarted = new Set<number>();

    for (const [courseId, totals] of totalsMap) {
      const progress = courseMap.get(courseId);
      if (!progress) continue;

      coursesStarted.add(courseId);
      const accuracy = progress.correct + progress.incorrect > 0
        ? Math.round((progress.correct / (progress.correct + progress.incorrect)) * 100)
        : 0;

      courseAnalytics.push({
        courseId,
        courseTitle: totals.title,
        courseImageSrc: totals.imageSrc,
        totalChallenges: totals.total,
        completedChallenges: progress.completed,
        correctCount: progress.correct,
        incorrectCount: progress.incorrect,
        accuracy,
      });

      const subject = detectSubject(totals.title);
      const sm = subjectMap.get(subject) || { total: 0, completed: 0, correct: 0, incorrect: 0 };
      sm.total += totals.total;
      sm.completed += progress.completed;
      sm.correct += progress.correct;
      sm.incorrect += progress.incorrect;
      subjectMap.set(subject, sm);
    }

    courseAnalytics.sort((a, b) => {
      const pctA = a.totalChallenges > 0 ? a.completedChallenges / a.totalChallenges : 0;
      const pctB = b.totalChallenges > 0 ? b.completedChallenges / b.totalChallenges : 0;
      return pctB - pctA;
    });

    const subjectAnalytics: SubjectAnalytics[] = Array.from(subjectMap.entries())
      .map(([subject, data]) => ({
        subject,
        totalChallenges: data.total,
        completedChallenges: data.completed,
        correctCount: data.correct,
        incorrectCount: data.incorrect,
        accuracy: data.correct + data.incorrect > 0
          ? Math.round((data.correct / (data.correct + data.incorrect)) * 100)
          : 0,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const diffOrder = ["easy", "medium", "hard"];
    const difficultyAnalytics: DifficultyAnalytics[] = diffOrder
      .filter((d) => diffMap.has(d))
      .map((d) => {
        const data = diffMap.get(d)!;
        return {
          difficulty: DIFFICULTY_LABELS[d] || d,
          total: data.total,
          correct: data.correct,
          incorrect: data.incorrect,
          accuracy: data.correct + data.incorrect > 0
            ? Math.round((data.correct / (data.correct + data.incorrect)) * 100)
            : 0,
        };
      });

    const typeAnalytics: ChallengeTypeAnalytics[] = Array.from(typeMap.entries())
      .map(([type, data]) => ({
        type: TYPE_LABELS[type] || type,
        total: data.total,
        correct: data.correct,
        incorrect: data.incorrect,
        accuracy: data.correct + data.incorrect > 0
          ? Math.round((data.correct / (data.correct + data.incorrect)) * 100)
          : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const totalCoursesCompleted = courseAnalytics.filter(
      (c) => c.totalChallenges > 0 && c.completedChallenges >= c.totalChallenges
    ).length;

    const overallAccuracy = totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;

    return {
      courseAnalytics,
      subjectAnalytics,
      difficultyAnalytics,
      typeAnalytics,
      summary: {
        totalPoints: points,
        totalCoursesStarted: coursesStarted.size,
        totalCoursesCompleted,
        totalChallengesCompleted: totalCompleted,
        totalCorrect,
        totalIncorrect,
        overallAccuracy,
        daysActive,
        currentStreak,
      },
    };
  } catch (error) {
    console.error("Error fetching profile analytics:", error);
    return null;
  }
}
