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
} from "@/db/schema";
import { getServerUser } from "@/lib/auth";


export const getUserProgress = cache(async () => {
  const user = await getServerUser();
  if (!user) {
    return null;
  }
  const userId = user.uid;

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
  const userId = user.uid;
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
  const userId = user.uid;
  
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
  const userId = user.uid;

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
  const userId = user.uid;

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

// Function to save student application
export const saveStudentApplication = async (applicationData: {
  studentName: string;
  studentSurname: string;
  studentPhoneNumber: string;
  studentEmail: string;
  field: string;
  studentNeeds?: string;
}) => {
  const data = await db.insert(privateLessonApplications).values(applicationData);
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

// Function to save teacher application
export const saveTeacherApplication = async (applicationData: {
  field: string;
  quizResult: number;
  passed: boolean;
  teacherName?: string;
  teacherSurname?: string;
  teacherPhoneNumber?: string;
  teacherEmail?: string;
  // Add more fields as needed
}) => {
  const data = await db.insert(teacherApplications).values(applicationData);
  return data;
};


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
  }: {
    search?: string;
  }) => {
    // If no search provided, just return all
    if (!search) {
      return db.select().from(snippets).orderBy(sql`created_at DESC`);
    }

    // If search is provided, we want to match language, title or userName
    // using ILIKE (case-insensitive). 
    return db
      .select()
      .from(snippets)
      .where(
        or(
          ilike(snippets.language, `%${search}%`),
          ilike(snippets.title, `%${search}%`),
          ilike(snippets.userName, `%${search}%`)
        )
      )
      .orderBy(sql`created_at DESC`);
  }
);

