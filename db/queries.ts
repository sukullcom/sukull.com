import { cache } from "react";
import db from "@/db/drizzle";
import { and, avg, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  challengeProgress,
  courses,
  lessons,
  units,
  userProgress,
  schools,
  quizQuestions,
  privateLessonApplications,
  teacherApplications,
  snippets,
  englishGroupApplications,
} from "@/db/schema";
import { getServerUser } from "@/lib/auth";


export const getUserProgress = cache(async () => {
  const user = await getServerUser();
  if (!user) {
    return null;
  }
  const userId = user.id;

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: true,
    },
  });

  return data;
});

export const getUnits = cache(async () => {
  const user = await getServerUser();
  if (!user) return [];
  const userId = user.id;
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeCourseId) {
    return [];
  }

  const data = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, userProgress.activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          challenges: {
            orderBy: (challenges, { asc }) => [asc(challenges.order)],
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

  const normalizedData = data.map((unit) => {
    const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
      if (lesson.challenges.length === 0) {
        return { ...lesson, completed: false };
      }
      const allCompletedChallenges = lesson.challenges.every((challenge) => {
        return (
          challenge.challengeProgress &&
          challenge.challengeProgress.length > 0 &&
          challenge.challengeProgress.every((progress) => progress.completed)
        );
      });

      return { ...lesson, completed: allCompletedChallenges };
    });

    return { ...unit, lessons: lessonsWithCompletedStatus };
  });

  return normalizedData;
});

export const getCourses = cache(async () => {
  const data = await db.query.courses.findMany();

  return data;
});

export const getCourseById = cache(async (courseId: number) => {
  const data = await db.query.courses.findFirst({
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

  return data;
});

export const getCourseProgress = cache(async () => {
  const user = await getServerUser();
  if (!user) {
    return null;
  }
  const userId = user.id;
  
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeCourseId) {
    return null;
  }

  const unitsInActiveCourse = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, userProgress.activeCourseId),
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
      return lesson.challenges.some((challenge) => {
        return (
          !challenge.challengeProgress ||
          challenge.challengeProgress.length === 0 ||
          challenge.challengeProgress.some(
            (progress) => progress.completed === false
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
    (challenge) => challenge.completed
  );
  const percentage = Math.round(
    (completedChallenges.length / lesson.challenges.length) * 100
  );

  return percentage;
});


export const getTopTenUsers = cache(async () => {
  // İsteğe göre kullanıcı girişine bağımlı kılmayabilirsiniz;
  // ama orijinalde userId yoksa boş array döndürüyordu.
  const user = await getServerUser();
  if (!user) {
    return [];
  }

  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    limit: 10,
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      points: true,
    }
  })

  return data
})


////// ADDED //////
export const getSchools = cache(async () => {
  const data = await db.query.schools.findMany({
    orderBy: (schools, { asc }) => [asc(schools.name)],
    columns: {
      id: true,
      name: true,
      type: true, // Include the type column
    },
  });

  return data;
});
////ADDED /////

export const getSchoolPointsByType = cache(async (schoolType: "university" | "high_school" | "secondary_school" | "elementary_school") => {
  // Fetch schools of the specified type
  const schoolList = await db.query.schools.findMany({
    where: eq(schools.type, schoolType),
    columns: { id: true, name: true },
  });

  // Calculate total points for each school
  const schoolPoints = await Promise.all(
    schoolList.map(async (school) => {
      const totalPointsResult = await db.query.userProgress.findMany({
        where: eq(userProgress.schoolId, school.id),
        columns: { points: true },
      });

      const totalPoints = totalPointsResult.reduce(
        (sum, user) => sum + (user.points || 0),
        0
      );

      return {
        schoolId: school.id,
        schoolName: school.name,
        totalPoints,
      };
    })
  );

  // Sort the school points in descending order of totalPoints
  schoolPoints.sort((a, b) => b.totalPoints - a.totalPoints);
  // Limit to top 10
  const topSchools = schoolPoints.slice(0, 10);

  return topSchools;
});

export const getUniversityPoints = cache(async () => {
  return getSchoolPointsByType("university");
});

export const getHighSchoolPoints = cache(async () => {
  return getSchoolPointsByType("high_school");
});

export const getSecondarySchoolPoints = cache(async () => {
  return getSchoolPointsByType("secondary_school");
});

export const getElementarySchoolPoints = cache(async () => {
  return getSchoolPointsByType("elementary_school");
});



export const getUserRank = cache(async () => {
  const user = await getServerUser();
  if (!user) {
    return null;
  }
  const userId = user.id;

  // Get current user's points and school ID
  const userProgressData = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { points: true, schoolId: true },
  });

  if (!userProgressData) {
    return null;
  }

  const { points, schoolId } = userProgressData;

  // Calculate user's rank among all users
  const users = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    columns: { userId: true, points: true },
  });

  const userRank = users.findIndex((user) => user.userId === userId) + 1;

  if (!schoolId) {
    return {
      userRank,
      schoolRank: null,
      userPoints: points,
      schoolRankInSchool: null,
      schoolId,
      schoolPoints: null,
    };
  }

  // Calculate user's rank within their school
  const schoolUsers = await db.query.userProgress.findMany({
    where: eq(userProgress.schoolId, schoolId),
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    columns: { userId: true, points: true },
  });

  const userRankInSchool = schoolUsers.findIndex((user) => user.userId === userId) + 1;

  // Get the type of the user's school
  const userSchoolData = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
    columns: { type: true },
  });

  const schoolType = userSchoolData?.type;

  if (!schoolType) {
    return {
      userRank,
      userRankInSchool,
      schoolRank: null,
      userPoints: points,
      schoolId,
      schoolPoints: null,
    };
  }

  // Dynamically get all schools of the same type and calculate rank
  const schoolsData = await db.query.schools.findMany({
    where: eq(schools.type, schoolType),
    orderBy: (schools, { desc }) => [desc(schools.totalPoints)],
    columns: { id: true, totalPoints: true },
  });

  const schoolRank = schoolsData.findIndex((school) => school.id === schoolId) + 1;

  return {
    userRank,
    userRankInSchool,
    schoolRank,
    userPoints: points,
    schoolId,
    schoolPoints: schoolsData.find((school) => school.id === schoolId)?.totalPoints || 0,
    schoolType,
  };
});



/////////////ADDED////////////////////

// Save student application (Öğrenci - Özel Ders Al)
export const saveStudentApplication = async (applicationData: {
  studentName: string;
  studentSurname: string;
  studentPhoneNumber: string;
  studentEmail: string;
  field: string;
  priceRange: string;
  studentNeeds?: string;
}) => {
  const data = await db
    .insert(privateLessonApplications)
    .values(applicationData);
  return data;
};

// Function to get quiz questions by field
export const getQuizQuestionsByField = cache(async (field: string) => {
  const questions = await db.query.quizQuestions.findMany({
    where: eq(quizQuestions.field, field),
    with: {
      options: true,
    },
  });
  return questions;
});

// Save teacher application (Öğretmen - Özel Ders Ver)
export async function saveTeacherApplication(applicationData: {
  field: string;
  quizResult: number;
  passed: boolean;
  teacherName?: string;
  teacherSurname?: string;
  teacherPhoneNumber?: string;
  teacherEmail?: string;
  priceRange: string;
}) {
  return await db.insert(teacherApplications).values(applicationData);
}

// Save English Group application (İngilizce Konuşma Grubu)
export async function saveEnglishGroupApplication(data: {
  participantName: string;
  participantSurname: string;
  participantPhoneNumber: string;
  participantEmail: string;
  quizResult: number;
  classification?: string;
}) {
  const result = await db
    .insert(englishGroupApplications)
    .values(data)
    .returning({ id: englishGroupApplications.id });
  return result; // array of inserted rows, typically length=1
}

export function getCEFRClassification(score: number): string {
  // For a 50-question quiz, example:
  //  0..10 => A1
  //  11..20 => A2
  //  21..30 => B1
  //  31..40 => B2
  //  41..45 => C1
  //  46..50 => C2
  if (score <= 10) return "A1";
  if (score <= 20) return "A2";
  if (score <= 30) return "B1";
  if (score <= 40) return "B2";
  if (score <= 45) return "C1";
  return "C2";
}

// English group => store classification
export async function updateEnglishGroupClassification(id: number, quizResult: number) {
  const classification = getCEFRClassification(quizResult);

  // Example: update that row with quizResult & classification
  return await db
    .update(englishGroupApplications)
    .set({
      quizResult,
      classification,
    })
    .where(eq(englishGroupApplications.id, id));
}


// Code Editor
// CREATE a snippet
export const createSnippet = async (data: {
  userId: string;
  userName: string;
  code: string;
  title: string;
  description: string;
  language: string;
}) => {
  await db.insert(snippets).values(data);
};

// GET user snippet count (to limit sharing to 3)
export const getUserSnippetCount = cache(async (userId: string) => {
  const [result] = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(snippets)
    .where(eq(snippets.userId, userId));

  return result?.count ?? 0;
});

// GET all snippets (with optional search filtering)
export const getAllSnippets = cache(
  async ({
    search,
    language,
    limit = 20,
    offset = 0,
  }: {
    search?: string;
    language?: string;
    limit?: number;
    offset?: number;
  }) => {
    return db
      .select()
      .from(snippets)
      .$dynamic() // Enable dynamic query building
      .where((qb) => {
        if (search) {
          return or(
            ilike(snippets.language, `%${search}%`),
            ilike(snippets.title, `%${search}%`),
            ilike(snippets.userName, `%${search}%`)
          );
        }
        return undefined; // No condition if no search
      })
      .where((qb) => (language ? eq(snippets.language, language) : undefined))
      .orderBy(sql`created_at DESC`)
      .limit(limit)
      .offset(offset);
  }
);

