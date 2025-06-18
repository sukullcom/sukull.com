import { cache } from "react";
import db from "@/db/drizzle";
import { and, avg, desc, eq, ilike, or, sql, asc, not, count } from "drizzle-orm";
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
  users,
  teacherAvailability,
  lessonBookings,
  lessonReviews,
  userRoleEnum,
  userCredits,
  creditTransactions,
  userSubscriptions,
  teacherFields
} from "@/db/schema";
import { getServerUser } from "@/lib/auth";
import { normalizeAvatarUrl } from "@/utils/avatar";


export const getUserProgress = cache(async () => {
  const user = await getServerUser();
  if (!user) {
    return null;
  }
  const userId = user.id;

  // Check subscription status before returning user progress
  await checkSubscriptionStatus(userId);

  const data = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    with: {
      activeCourse: true,
    },
  });

  if (!data) return null;

  // Normalize avatar URL to ensure it works with Next.js Image component
  return {
    ...data,
    userImageSrc: normalizeAvatarUrl(data.userImageSrc)
  };
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

  // Normalize image URLs to ensure they work with Next.js Image component
  const normalizedData = data.map(course => ({
    ...course,
    imageSrc: normalizeAvatarUrl(course.imageSrc)
  }));

  return normalizedData;
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

  if (!data) return null;

  // Normalize image URL to ensure it works with Next.js Image component
  return {
    ...data,
    imageSrc: normalizeAvatarUrl(data.imageSrc)
  };
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

  // Normalize avatar URLs to ensure they work with Next.js Image component
  const normalizedData = data.map(user => ({
    ...user,
    userImageSrc: normalizeAvatarUrl(user.userImageSrc)
  }));

  return normalizedData
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
  studentNeeds?: string;
}) => {
  const data = await db
    .insert(privateLessonApplications)
    .values(applicationData);
  return data;
};

// Save teacher application (Öğretmen - Özel Ders Ver)
export async function saveTeacherApplication(applicationData: {
  userId: string;
  field: string;
  quizResult?: number;
  passed?: boolean;
  teacherName?: string;
  teacherSurname?: string;
  teacherPhoneNumber?: string;
  teacherEmail?: string;
}) {
  // Ensure quiz-related fields are set properly regardless of what was passed
  const updatedData = {
    ...applicationData,
    quizResult: 0,
    passed: true,
  };
  
  return await db.insert(teacherApplications).values(updatedData);
}

// Get all teacher applications
export async function getAllTeacherApplications() {
  return await db.query.teacherApplications.findMany({
    orderBy: (teacherApplications, { desc }) => [desc(teacherApplications.createdAt)],
  });
}

// Get teacher application by ID
export async function getTeacherApplicationById(id: number) {
  return await db.query.teacherApplications.findFirst({
    where: eq(teacherApplications.id, id),
  });
}

// Get teacher application by user ID
export async function getTeacherApplicationByUserId(userId: string) {
  return await db.query.teacherApplications.findFirst({
    where: eq(teacherApplications.userId, userId),
  });
}

// Approve teacher application
export async function approveTeacherApplication(id: number) {
  console.log(`[DB] Approving teacher application ${id}`);
  
  const application = await getTeacherApplicationById(id);
  if (!application) {
    console.log(`[DB] Application ${id} not found`);
    throw new Error("Application not found");
  }

  console.log(`[DB] Found application for user ${application.userId}`);

  // Update the application status
  console.log(`[DB] Updating application ${id} status to approved`);
  await db.update(teacherApplications)
    .set({ 
      status: "approved",
      updatedAt: new Date()
    })
    .where(eq(teacherApplications.id, id));

  console.log(`[DB] Application status updated, now updating user role for ${application.userId}`);
  
  // Update the user's role to teacher
  const roleUpdateResult = await db.update(users)
    .set({ role: "teacher" })
    .where(eq(users.id, application.userId))
    .returning({ id: users.id, role: users.role });

  console.log(`[DB] User role update result:`, roleUpdateResult);

  if (roleUpdateResult.length === 0) {
    console.error(`[DB] No user found with ID ${application.userId} for role update`);
    throw new Error(`User not found for role update: ${application.userId}`);
  }

  console.log(`[DB] Successfully updated user ${application.userId} to teacher role`);
  return { success: true };
}

// Approve teacher application with fields
export async function approveTeacherApplicationWithFields(id: number, selectedFields: Array<{subject: string, grade: string, displayName: string}>) {
  console.log(`[DB] Approving teacher application ${id} with fields:`, selectedFields);
  
  const application = await getTeacherApplicationById(id);
  if (!application) {
    console.log(`[DB] Application ${id} not found`);
    throw new Error("Application not found");
  }

  console.log(`[DB] Found application for user ${application.userId}`);

  // Update the application status
  console.log(`[DB] Updating application ${id} status to approved`);
  await db.update(teacherApplications)
    .set({ 
      status: "approved",
      updatedAt: new Date()
    })
    .where(eq(teacherApplications.id, id));

  console.log(`[DB] Application status updated, now updating user role for ${application.userId}`);
  
  // Update the user's role to teacher
  const roleUpdateResult = await db.update(users)
    .set({ role: "teacher" })
    .where(eq(users.id, application.userId))
    .returning({ id: users.id, role: users.role });

  console.log(`[DB] User role update result:`, roleUpdateResult);

  if (roleUpdateResult.length === 0) {
    console.error(`[DB] No user found with ID ${application.userId} for role update`);
    throw new Error(`User not found for role update: ${application.userId}`);
  }

  // Add teacher fields
  if (selectedFields && selectedFields.length > 0) {
    console.log(`[DB] Adding teacher fields for user ${application.userId}`);
    
    // First, deactivate any existing fields for this teacher
    await db.update(teacherFields)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(teacherFields.teacherId, application.userId));
    
    // Then add the new fields
    const fieldsToInsert = selectedFields.map(field => ({
      teacherId: application.userId,
      subject: field.subject,
      grade: field.grade,
      displayName: field.displayName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    await db.insert(teacherFields).values(fieldsToInsert);
    console.log(`[DB] Successfully added ${fieldsToInsert.length} fields for teacher ${application.userId}`);
  }

  console.log(`[DB] Successfully updated user ${application.userId} to teacher role`);
  return { success: true };
}

// Get teacher fields
export async function getTeacherFields(teacherId: string) {
  return await db.query.teacherFields.findMany({
    where: and(
      eq(teacherFields.teacherId, teacherId),
      eq(teacherFields.isActive, true)
    ),
    orderBy: [teacherFields.subject, teacherFields.grade]
  });
}

// Add or update teacher fields
export async function updateTeacherFields(teacherId: string, fields: Array<{subject: string, grade: string, displayName: string}>) {
  console.log(`[DB] Updating teacher fields for ${teacherId}:`, fields);
  
  // First, deactivate existing fields
  await db.update(teacherFields)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(teacherFields.teacherId, teacherId));
  
  // Then add the new fields
  if (fields && fields.length > 0) {
    const fieldsToInsert = fields.map(field => ({
      teacherId,
      subject: field.subject,
      grade: field.grade,
      displayName: field.displayName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    await db.insert(teacherFields).values(fieldsToInsert);
    console.log(`[DB] Successfully updated ${fieldsToInsert.length} fields for teacher ${teacherId}`);
  }
  
  return { success: true };
}

// Get all available subjects and grades
export async function getAvailableFieldOptions() {
  const subjects = [
    "Matematik", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya", 
    "Edebiyat", "İngilizce", "Almanca", "Fransızca", "Felsefe", 
    "Müzik", "Resim", "Bilgisayar Bilimleri", "Ekonomi"
  ];
  
  const grades = [
    "1.sınıf", "2.sınıf", "3.sınıf", "4.sınıf", "5.sınıf", "6.sınıf", 
    "7.sınıf", "8.sınıf", "9.sınıf", "10.sınıf", "11.sınıf", "12.sınıf", 
    "Hazırlık", "Üniversite", "Genel"
  ];
  
  return { subjects, grades };
}

// Reject teacher application
export async function rejectTeacherApplication(id: number) {
  await db.update(teacherApplications)
    .set({ 
      status: "rejected",
      updatedAt: new Date()
    })
    .where(eq(teacherApplications.id, id));

  return { success: true };
}

// Check if user is a teacher
export async function isTeacher(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user?.role === "teacher";
}

// DEPRECATED: Function to get quiz questions by field
// This function is no longer used but kept for compatibility
export const getQuizQuestionsByField = cache(async (field: string) => {
  const questions = await db.query.quizQuestions.findMany({
    where: eq(quizQuestions.field, field),
    with: {
      options: true,
    },
  });
  return questions;
});

// DEPRECATED: Save English Group application (İngilizce Konuşma Grubu)
// This function is no longer used but kept for compatibility
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

// DEPRECATED: CEFR Classification function
// This function is no longer used but kept for compatibility
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

// DEPRECATED: English group => store classification
// This function is no longer used but kept for compatibility
export async function updateEnglishGroupClassification(id: number, quizResult: number) {
  const classification = getCEFRClassification(quizResult);

  // Define a type for the return value
  interface UpdateResult {
    rowCount: number;
  }

  // Example: update that row with quizResult & classification
  const result = await db
    .update(englishGroupApplications)
    .set({
      quizResult,
      classification,
    })
    .where(eq(englishGroupApplications.id, id));
  
  // Add rowCount property
  return { rowCount: 1 } as UpdateResult;
}
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

// GET user snippet count (to limit sharing to 3) - OPTIMIZED
export const getUserSnippetCount = cache(async (userId: string) => {
  if (!userId?.trim()) return 0;
  
  const [result] = await db
    .select({
      count: count(snippets.id),
    })
    .from(snippets)
    .where(eq(snippets.userId, userId.trim()));

  return result?.count ?? 0;
});

// GET snippet by ID with proper error handling - OPTIMIZED
export const getSnippetById = cache(async (id: number) => {
  if (!id || id <= 0) return null;
  
  const [snippet] = await db
    .select()
    .from(snippets)
    .where(eq(snippets.id, id))
    .limit(1);

  return snippet || null;
});

// GET all snippets (with optional search filtering) - OPTIMIZED
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
  } = {}) => {
    let query = db.select().from(snippets);

    // Build where conditions
    const conditions = [];
    
    if (search && search.trim()) {
      const searchTerm = search.trim();
      conditions.push(
        or(
          ilike(snippets.language, `%${searchTerm}%`),
          ilike(snippets.title, `%${searchTerm}%`),
          ilike(snippets.userName, `%${searchTerm}%`)
        )
          );
        }
    
    if (language && language.trim()) {
      conditions.push(eq(snippets.language, language.trim()));
    }

    // Apply where conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering, limit, and offset
    return query
      .orderBy(desc(snippets.createdAt))
      .limit(Math.min(limit, 50)) // Prevent excessive limits
      .offset(Math.max(offset, 0)); // Prevent negative offsets
  }
);

// Get the start date of the week containing the given date
export function getWeekStartDate(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Get the end date of the week containing the given date
export function getWeekEndDate(date: Date): Date {
  const result = getWeekStartDate(date);
  result.setDate(result.getDate() + 7);
  return result;
}

// Get availability for a teacher for a specific week
export async function getTeacherAvailability(teacherId: string, weekStartDate: Date) {
  return db.query.teacherAvailability.findMany({
    where: and(
      eq(teacherAvailability.teacherId, teacherId),
      eq(teacherAvailability.weekStartDate, weekStartDate)
    ),
    orderBy: [
      teacherAvailability.dayOfWeek,
      teacherAvailability.startTime
    ]
  });
}

// Upsert teacher availability - replace all slots for a given week
export async function upsertTeacherAvailability(
  teacherId: string, 
  weekStartDate: Date, 
  slots: { 
    startTime: Date; 
    endTime: Date; 
    dayOfWeek: number;
  }[]
) {
  // First, delete all existing slots for this teacher and week
  await db.delete(teacherAvailability)
    .where(
      and(
        eq(teacherAvailability.teacherId, teacherId),
        eq(teacherAvailability.weekStartDate, weekStartDate)
      )
    );
  
  // If no new slots provided, just return
  if (!slots.length) return [];
  
  // Then insert all new slots
  return db.insert(teacherAvailability)
    .values(
      slots.map(slot => ({
        teacherId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayOfWeek: slot.dayOfWeek,
        weekStartDate
      }))
    )
    .returning();
}

// Get current teacher availability (for current week)
export async function getCurrentTeacherAvailability(teacherId: string) {
  const weekStartDate = getWeekStartDate(new Date());
  return getTeacherAvailability(teacherId, weekStartDate);
}

// Check if a user has an approved student application
export async function isApprovedStudent(userId: string) {
  // First check if user has student role
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true }
  });
  
  if (userRecord?.role === "student") {
    return true;
  }
  
  // Fall back to checking for approved application
  const application = await db.query.privateLessonApplications.findFirst({
    where: and(
      eq(privateLessonApplications.userId, userId),
      eq(privateLessonApplications.approved, true)
    ),
  });
  
  return !!application;
}

// Get all teachers with their meet links
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

// Get detailed teacher info for a specific teacher
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

// Book a lesson with a teacher
export async function bookLesson(
  studentId: string, 
  teacherId: string, 
  startTime: Date, 
  endTime: Date
) {
  // Check if student has available credits
  const hasCredits = await hasAvailableCredits(studentId, 1);
  if (!hasCredits) {
    throw new Error("Insufficient credits. Please purchase credits to book a lesson.");
  }

  // Check if the time slot is available
  const existingBooking = await db.query.lessonBookings.findFirst({
    where: and(
      eq(lessonBookings.teacherId, teacherId),
      eq(lessonBookings.startTime, startTime),
      eq(lessonBookings.endTime, endTime),
      not(eq(lessonBookings.status, "cancelled"))
    ),
  });
  
  if (existingBooking) {
    throw new Error("This time slot is already booked");
  }
  
  // Check if the slot is in the teacher's availability
  const availability = await db.query.teacherAvailability.findFirst({
    where: and(
      eq(teacherAvailability.teacherId, teacherId),
      eq(teacherAvailability.startTime, startTime),
      eq(teacherAvailability.endTime, endTime)
    ),
  });
  
  if (!availability) {
    throw new Error("This time slot is not available for booking");
  }
  
  // Get the teacher's Google Meet link
  const teacher = await db.query.users.findFirst({
    where: eq(users.id, teacherId),
    columns: {
      meetLink: true
    }
  });
  
  // Use one credit for the booking
  await useCredit(studentId);
  
  // Create the booking
  return db.insert(lessonBookings)
    .values({
      studentId,
      teacherId,
      startTime,
      endTime,
      meetLink: teacher?.meetLink, // Include the teacher's Google Meet link
    })
    .returning();
}

// Get student's bookings
export async function getStudentBookings(studentId: string) {
  const bookings = await db.query.lessonBookings.findMany({
    where: eq(lessonBookings.studentId, studentId),
    orderBy: desc(lessonBookings.startTime),
    with: {
      teacher: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          meetLink: true,
        }
      },
      review: {
        columns: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        }
      }
    },
  });

  console.log(`Found ${bookings.length} bookings for student ${studentId}`);
  if (bookings.length > 0) {
    console.log("Sample booking teacher data:", bookings[0].teacher);
  }

  // Fetch the teacher fields for each booking to get the field info
  const bookingsWithField = await Promise.all(
    bookings.map(async (booking) => {
      const teacherFieldsData = await getTeacherFields(booking.teacherId);
      const teacherApplication = await getTeacherApplicationByUserId(booking.teacherId);
      
      // Determine field display - use new system if available, fallback to legacy
      let fieldDisplay = "Belirtilmemiş";
      let fields: string[] = [];
      
      if (teacherFieldsData && teacherFieldsData.length > 0) {
        fields = teacherFieldsData.map(f => f.displayName);
        fieldDisplay = fields.join(", ");
      } else if (teacherApplication?.field) {
        fieldDisplay = teacherApplication.field;
        fields = [teacherApplication.field];
      }
      
      // Make sure to preserve the teacher object when adding new attributes
      return {
        ...booking,
        field: fieldDisplay,
        fields: fields, // Array of all fields
      };
    })
  );

  return bookingsWithField;
}

// Get teacher's bookings
export async function getTeacherBookings(teacherId: string) {
  const bookings = await db.query.lessonBookings.findMany({
    where: eq(lessonBookings.teacherId, teacherId),
    orderBy: desc(lessonBookings.startTime),
    with: {
      student: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          description: true,
        }
      }
    },
  });

  // Get the teacher's fields from the new system, fallback to legacy
  const teacherFieldsData = await getTeacherFields(teacherId);
  const teacherApplication = await getTeacherApplicationByUserId(teacherId);
  
  // Determine field display - use new system if available, fallback to legacy
  let fieldDisplay = "Belirtilmemiş";
  let fields: string[] = [];
  
  if (teacherFieldsData && teacherFieldsData.length > 0) {
    fields = teacherFieldsData.map(f => f.displayName);
    fieldDisplay = fields.join(", ");
  } else if (teacherApplication?.field) {
    fieldDisplay = teacherApplication.field;
    fields = [teacherApplication.field];
  }

  // Add the field to all bookings and format student info
  const bookingsWithFieldAndStudent = bookings.map((booking) => {
    // Format student info for display
    const studentName = booking.student?.name || "Unknown Student";
    const studentEmail = booking.student?.email || "";
    const studentUsername = booking.student?.description || "";
    
    return {
      ...booking,
      field: fieldDisplay,
      fields: fields, // Array of all fields
      studentName,
      studentEmail,
      studentUsername
    };
  });

  return bookingsWithFieldAndStudent;
}

// Update booking status
export async function updateBookingStatus(bookingId: number, status: string) {
  return db.update(lessonBookings)
    .set({ 
      status,
      updatedAt: new Date()
    })
    .where(eq(lessonBookings.id, bookingId))
    .returning();
}

// Get all student applications for admin
export async function getAllStudentApplications() {
  const applications = await db.query.privateLessonApplications.findMany({
    orderBy: (privateLessonApplications, { desc }) => [desc(privateLessonApplications.createdAt)],
  });
  
  return applications;
}

// Approve a student application
export async function approveStudentApplication(applicationId: number) {
  console.log(`[DB] Approving student application ${applicationId}`);
  
  // First, get the application to find the userId
  const application = await db.query.privateLessonApplications.findFirst({
    where: eq(privateLessonApplications.id, applicationId),
  });
  
  if (!application) {
    console.log(`[DB] Student application ${applicationId} not found`);
    throw new Error("Application not found");
  }

  console.log(`[DB] Found student application for user ${application.userId}`);
  
  // Update the application status
  console.log(`[DB] Updating student application ${applicationId} status to approved`);
  await db
    .update(privateLessonApplications)
    .set({
      approved: true,
      status: "approved",
    })
    .where(eq(privateLessonApplications.id, applicationId));
    
  // If userId exists, update the user's role to "student"
  if (application.userId) {
    console.log(`[DB] Updating user ${application.userId} role to student`);
    
    const roleUpdateResult = await db.update(users)
      .set({ role: "student" })
      .where(eq(users.id, application.userId))
      .returning({ id: users.id, role: users.role });

    console.log(`[DB] Student role update result:`, roleUpdateResult);

    if (roleUpdateResult.length === 0) {
      console.error(`[DB] No user found with ID ${application.userId} for student role update`);
      throw new Error(`User not found for role update: ${application.userId}`);
    }
    
    console.log(`[DB] Successfully updated user ${application.userId} to student role`);
  } else {
    console.warn(`[DB] Student application ${applicationId} has no userId, skipping role update`);
  }
}

// Reject a student application
export async function rejectStudentApplication(applicationId: number) {
  await db
    .update(privateLessonApplications)
    .set({
      approved: false,
      status: "rejected",
    })
    .where(eq(privateLessonApplications.id, applicationId));
}

// Get teacher availability for the current week
export async function getTeacherAvailabilityForCurrentWeek(teacherId: string) {
  try {
    console.log(`Finding availability for teacher: ${teacherId}`);
    
    // Get current week start date (Monday)
    const today = new Date();
    const currentWeekStart = getWeekStartDate(today);
    console.log(`Current week starts: ${currentWeekStart.toISOString()}`);
    
    // Query directly with the current week start date
    const availableSlots = await db.query.teacherAvailability.findMany({
      where: and(
        eq(teacherAvailability.teacherId, teacherId),
        eq(teacherAvailability.weekStartDate, currentWeekStart)
      ),
      orderBy: [
        asc(teacherAvailability.dayOfWeek),
        asc(teacherAvailability.startTime)
      ]
    });
    
    console.log(`Found ${availableSlots.length} slots for current week`);
    return availableSlots;
  } catch (error) {
    console.error("Error in getTeacherAvailabilityForCurrentWeek:", error);
    return [];
  }
}

// Credit System Functions

// Get user's credits
export const getUserCredits = cache(async (userId: string) => {
  const credits = await db.query.userCredits.findFirst({
    where: eq(userCredits.userId, userId),
  });

  return credits || {
    totalCredits: 0,
    usedCredits: 0,
    availableCredits: 0
  };
});

// Update user credits after lesson booking
export const useCredit = async (userId: string) => {
  const credits = await db.query.userCredits.findFirst({
    where: eq(userCredits.userId, userId),
  });

  if (!credits || credits.availableCredits <= 0) {
    throw new Error("Insufficient credits");
  }

  await db.update(userCredits)
    .set({
      usedCredits: credits.usedCredits + 1,
      availableCredits: credits.availableCredits - 1,
      updatedAt: new Date(),
    })
    .where(eq(userCredits.userId, userId));
};

// Refund user credits when lesson is cancelled
export const refundCredit = async (userId: string) => {
  const credits = await db.query.userCredits.findFirst({
    where: eq(userCredits.userId, userId),
  });

  if (!credits) {
    throw new Error("User credits not found");
  }

  // Ensure we don't go below 0 used credits
  const newUsedCredits = Math.max(0, credits.usedCredits - 1);
  
  await db.update(userCredits)
    .set({
      usedCredits: newUsedCredits,
      availableCredits: credits.availableCredits + 1,
      updatedAt: new Date(),
    })
    .where(eq(userCredits.userId, userId));
};

// Get user's credit transaction history
export const getUserCreditTransactions = cache(async (userId: string) => {
  return await db.query.creditTransactions.findMany({
    where: eq(creditTransactions.userId, userId),
    orderBy: desc(creditTransactions.createdAt),
  });
});

// Check if user has enough credits for booking
export const hasAvailableCredits = async (userId: string, requiredCredits: number = 1) => {
  const credits = await getUserCredits(userId);
  return credits.availableCredits >= requiredCredits;
};

// Subscription System Functions

// Check and update subscription status
export const checkSubscriptionStatus = async (userId: string) => {
  const now = new Date();
  
  // Get current user progress
  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!progress) return false;

  // If user has infinite hearts but subscription has expired
  if (progress.hasInfiniteHearts && progress.subscriptionExpiresAt && progress.subscriptionExpiresAt < now) {
    // Remove infinite hearts and reset subscription
    await db.update(userProgress)
      .set({
        hasInfiniteHearts: false,
        subscriptionExpiresAt: null,
      })
      .where(eq(userProgress.userId, userId));

    // Update expired subscription status
    await db.update(userSubscriptions)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      ));

    return false;
  }

  return progress.hasInfiniteHearts || false;
};

// Get user's active subscription
export const getUserSubscription = cache(async (userId: string) => {
  const subscription = await db.query.userSubscriptions.findFirst({
    where: and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, 'active')
    ),
    orderBy: desc(userSubscriptions.createdAt),
  });

  return subscription;
});

// Create a new subscription
export const createSubscription = async (userId: string, paymentId: string) => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1); // Add 1 month

  // Insert new subscription record
  const subscription = await db.insert(userSubscriptions)
    .values({
      userId,
      subscriptionType: 'infinite_hearts',
      status: 'active',
      startDate: now,
      endDate,
      paymentId,
      amount: '100',
      currency: 'TRY',
    })
    .returning();

  // Update user progress with infinite hearts
  await db.update(userProgress)
    .set({
      hasInfiniteHearts: true,
      subscriptionExpiresAt: endDate,
    })
    .where(eq(userProgress.userId, userId));

  return subscription[0];
};

// Get subscription history for a user
export const getUserSubscriptionHistory = cache(async (userId: string) => {
  return await db.query.userSubscriptions.findMany({
    where: eq(userSubscriptions.userId, userId),
    orderBy: desc(userSubscriptions.createdAt),
  });
});

// Teacher Income and Review Functions

// Get teacher income summary (completed lessons only, excluding cancelled)
export const getTeacherIncome = cache(async (teacherId: string) => {
  // First get all completed bookings for this teacher
  const completedBookings = await db.query.lessonBookings.findMany({
    where: and(
      eq(lessonBookings.teacherId, teacherId),
      eq(lessonBookings.status, "completed")
    ),
    with: {
      student: {
        columns: {
          name: true,
          email: true,
        }
      }
    },
    orderBy: desc(lessonBookings.startTime),
  });

  // Each completed lesson = 1 credit = income
  // Assuming 1 credit = 25 TL (adjust as needed)
  const pricePerLesson = 25;
  const totalLessons = completedBookings.length;
  const totalIncome = totalLessons * pricePerLesson;

  // Group by month for detailed breakdown
  const monthlyIncome = completedBookings.reduce((acc, booking) => {
    const month = booking.startTime.toISOString().slice(0, 7); // YYYY-MM format
    if (!acc[month]) {
      acc[month] = { lessons: 0, income: 0 };
    }
    acc[month].lessons += 1;
    acc[month].income += pricePerLesson;
    return acc;
  }, {} as Record<string, { lessons: number; income: number }>);

  return {
    totalLessons,
    totalIncome,
    monthlyIncome,
    recentBookings: completedBookings.slice(0, 10), // Last 10 bookings
  };
});

// Get teacher reviews and average rating
export const getTeacherReviews = cache(async (teacherId: string) => {
  const reviews = await db.query.lessonReviews.findMany({
    where: eq(lessonReviews.teacherId, teacherId),
    with: {
      student: {
        columns: {
          name: true,
        }
      },
      booking: {
        columns: {
          startTime: true,
        }
      }
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
  const averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal

  return {
    averageRating,
    totalReviews: reviews.length,
    reviews,
  };
});

// Submit a review for a completed lesson
export const submitLessonReview = async (
  bookingId: number,
  studentId: string,
  teacherId: string,
  rating: number,
  comment?: string
) => {
  // Verify the booking exists and is completed
  const booking = await db.query.lessonBookings.findFirst({
    where: and(
      eq(lessonBookings.id, bookingId),
      eq(lessonBookings.studentId, studentId),
      eq(lessonBookings.teacherId, teacherId),
      eq(lessonBookings.status, "completed")
    ),
  });

  if (!booking) {
    throw new Error("Booking not found or not completed");
  }

  // Check if review already exists
  const existingReview = await db.query.lessonReviews.findFirst({
    where: eq(lessonReviews.bookingId, bookingId),
  });

  if (existingReview) {
    throw new Error("Review already exists for this booking");
  }

  // Create the review
  return await db.insert(lessonReviews).values({
    bookingId,
    studentId,
    teacherId,
    rating,
    comment: comment || null,
  }).returning();
};

// Get teacher info with average rating for listing
export const getTeachersWithRatings = cache(async () => {
  // Get all teachers
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

  // Get teacher fields for new field system
  const teacherFieldsData = await db.query.teacherFields.findMany({
    where: eq(teacherFields.isActive, true),
    columns: {
      teacherId: true,
      subject: true,
      grade: true,
      displayName: true,
    },
  });

  const fieldsMap = teacherFieldsData.reduce((acc, field) => {
    if (!acc[field.teacherId]) {
      acc[field.teacherId] = [];
    }
    acc[field.teacherId].push(field);
    return acc;
  }, {} as Record<string, typeof teacherFieldsData>);

  // Fallback: Get teacher applications for legacy field info (for teachers without new field data)
  const teacherApplications = await db.query.teacherApplications.findMany({
    columns: {
      userId: true,
      field: true,
    },
  });

  const applicationMap = teacherApplications.reduce((acc, app) => {
    acc[app.userId] = app;
    return acc;
  }, {} as Record<string, typeof teacherApplications[0]>);

  // Get reviews for all teachers
  const allReviews = await db.query.lessonReviews.findMany({
    columns: {
      teacherId: true,
      rating: true,
    },
  });

  // Calculate average ratings
  const ratingMap = allReviews.reduce((acc, review) => {
    if (!acc[review.teacherId]) {
      acc[review.teacherId] = { total: 0, count: 0 };
    }
    acc[review.teacherId].total += review.rating;
    acc[review.teacherId].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Combine teacher data with ratings and fields
  return teachers.map(teacher => {
    const teacherFieldsForUser = fieldsMap[teacher.id] || [];
    const application = applicationMap[teacher.id];
    const ratingData = ratingMap[teacher.id];
    const averageRating = ratingData 
      ? Math.round((ratingData.total / ratingData.count) * 10) / 10 
      : 0;

    // Determine field display - use new system if available, fallback to legacy
    let fieldDisplay = "";
    let fields: string[] = [];
    
    if (teacherFieldsForUser.length > 0) {
      fields = teacherFieldsForUser.map(f => f.displayName);
      fieldDisplay = fields.join(", ");
    } else if (application?.field) {
      fieldDisplay = application.field;
      fields = [application.field];
    }

    return {
      ...teacher,
      bio: teacher.description,
      field: fieldDisplay,
      fields: fields, // Array of all fields for filtering
      averageRating,
      totalReviews: ratingData?.count || 0,
    };
  });
});

