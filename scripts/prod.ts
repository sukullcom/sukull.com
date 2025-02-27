import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../db/schema";

// Create a postgres-js client using the DATABASE_URL
const client = postgres(process.env.DATABASE_URL!);

// Initialize drizzle with the client and your schema
const db = drizzle(client, { schema });

const main = async () => {
  try {
    console.log("Seeding database");

    // Delete all existing data in proper order
    await Promise.all([
      db.delete(schema.challengeOptions),
      db.delete(schema.challengeProgress),
      db.delete(schema.challenges),
      db.delete(schema.lessons),
      db.delete(schema.units),
      db.delete(schema.courses),
      db.delete(schema.userProgress),
      db.delete(schema.schools),
      db.delete(schema.quizOptions),
      db.delete(schema.quizQuestions),
      db.delete(schema.teacherApplications),
      db.delete(schema.privateLessonApplications)
    ]);

    // Insert schools with types
    const schools = await db
      .insert(schema.schools)
      .values([
        // Universities
        { name: "Boğaziçi1 Üniversitesi", totalPoints: 0, type: "university" },
        { name: "İstanbul1 Teknik Üniversitesi", totalPoints: 0, type: "university" },
        { name: "Orta Doğu1 Teknik Üniversitesi", totalPoints: 0, type: "university" },
        { name: "Boğaziçi2 Üniversitesi", totalPoints: 0, type: "university" },
        { name: "İstanbul2 Teknik Üniversitesi", totalPoints: 0, type: "university" },
        { name: "Orta Doğu2 Teknik Üniversitesi", totalPoints: 0, type: "university" },
        { name: "Boğaziçi3 Üniversitesi", totalPoints: 0, type: "university" },
        { name: "İstanbul3 Teknik Üniversitesi", totalPoints: 0, type: "university" },
        { name: "Orta Doğu3 Teknik Üniversitesi", totalPoints: 0, type: "university" },
        { name: "Boğaziçi4 Üniversitesi", totalPoints: 0, type: "university" },
        { name: "İstanbul4 Teknik Üniversitesi", totalPoints: 0, type: "university" },
        { name: "Orta Doğu4 Teknik Üniversitesi", totalPoints: 0, type: "university" },
        { name: "Boğaziçi5 Üniversitesi", totalPoints: 0, type: "university" },
        { name: "İstanbul5 Teknik Üniversitesi", totalPoints: 0, type: "university" },
        { name: "Orta Doğu5 Teknik Üniversitesi", totalPoints: 0, type: "university" },

        // High Schools
        { name: "Kabataş Erkek Lisesi", totalPoints: 0, type: "high_school" },
        { name: "Galatasaray Lisesi", totalPoints: 0, type: "high_school" },
        { name: "Fen Lisesi", totalPoints: 0, type: "high_school" },

        // Secondary Schools
        { name: "Mehmet Akif Ortaokulu", totalPoints: 0, type: "secondary_school" },
        { name: "Atatürk Ortaokulu", totalPoints: 0, type: "secondary_school" },
        { name: "Cumhuriyet Ortaokulu", totalPoints: 0, type: "secondary_school" },

        // Elementary Schools
        { name: "Zafer İlkokulu", totalPoints: 0, type: "elementary_school" },
        { name: "Barış İlkokulu", totalPoints: 0, type: "elementary_school" },
        { name: "İstiklal İlkokulu", totalPoints: 0, type: "elementary_school" }
      ])
      .returning();

    // Insert courses
    const courses = await db
      .insert(schema.courses)
      .values([{ title: "Spanish", imageSrc: "/es.svg" }])
      .returning();

    // For each course, insert units
    for (const course of courses) {
      const units = await db
        .insert(schema.units)
        .values([
          {
            courseId: course.id,
            title: "Unit 1",
            description: `Learn the basics of ${course.title}`,
            order: 1,
          },
          {
            courseId: course.id,
            title: "Unit 2",
            description: `Learn intermediate ${course.title}`,
            order: 2,
          },
        ])
        .returning();

      // For each unit, insert lessons
      for (const unit of units) {
        const lessons = await db
          .insert(schema.lessons)
          .values([
            { unitId: unit.id, title: "Nouns", order: 1 },
            { unitId: unit.id, title: "Verbs", order: 2 },
            { unitId: unit.id, title: "Adjectives", order: 3 },
            { unitId: unit.id, title: "Phrases", order: 4 },
            { unitId: unit.id, title: "Sentences", order: 5 },
          ])
          .returning();

        // For each lesson, insert challenges
        for (const lesson of lessons) {
          const challenges = await db
            .insert(schema.challenges)
            .values([
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: 'Which one of these is "the man"?',
                order: 1,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: 'Which one of these is "the woman"?',
                order: 2,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: 'Which one of these is "the boy"?',
                order: 3,
              },
              {
                lessonId: lesson.id,
                type: "ASSIST",
                question: '"the man"',
                order: 4,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: 'Which one of these is "the zombie"?',
                order: 5,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: 'Which one of these is "the robot"?',
                order: 6,
              },
              {
                lessonId: lesson.id,
                type: "SELECT",
                question: 'Which one of these is "the girl"?',
                order: 7,
              },
              {
                lessonId: lesson.id,
                type: "ASSIST",
                question: '"the zombie"',
                order: 8,
              },
            ])
            .returning();

          // For each challenge, insert challenge options based on order
          for (const challenge of challenges) {
            if (challenge.order === 1) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "el hombre",
                  imageSrc: "/man.svg",
                  audioSrc: "/es_man.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "la mujer",
                  imageSrc: "/woman.svg",
                  audioSrc: "/es_woman.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el chico",
                  imageSrc: "/boy.svg",
                  audioSrc: "/es_boy.mp3",
                },
              ]);
            }
            if (challenge.order === 2) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "la mujer",
                  imageSrc: "/woman.svg",
                  audioSrc: "/es_woman.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el chico",
                  imageSrc: "/boy.svg",
                  audioSrc: "/es_boy.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el hombre",
                  imageSrc: "/man.svg",
                  audioSrc: "/es_man.mp3",
                },
              ]);
            }
            if (challenge.order === 3) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "la mujer",
                  imageSrc: "/woman.svg",
                  audioSrc: "/es_woman.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el hombre",
                  imageSrc: "/man.svg",
                  audioSrc: "/es_man.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "el chico",
                  imageSrc: "/boy.svg",
                  audioSrc: "/es_boy.mp3",
                },
              ]);
            }
            if (challenge.order === 4) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "la mujer",
                  audioSrc: "/es_woman.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "el hombre",
                  audioSrc: "/es_man.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el chico",
                  audioSrc: "/es_boy.mp3",
                },
              ]);
            }
            if (challenge.order === 5) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el hombre",
                  imageSrc: "/man.svg",
                  audioSrc: "/es_man.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "la mujer",
                  imageSrc: "/woman.svg",
                  audioSrc: "/es_woman.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "el zombie",
                  imageSrc: "/zombie.svg",
                  audioSrc: "/es_zombie.mp3",
                },
              ]);
            }
            if (challenge.order === 6) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "el robot",
                  imageSrc: "/robot.svg",
                  audioSrc: "/es_robot.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el zombie",
                  imageSrc: "/zombie.svg",
                  audioSrc: "/es_zombie.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el chico",
                  imageSrc: "/boy.svg",
                  audioSrc: "/es_boy.mp3",
                },
              ]);
            }
            if (challenge.order === 7) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "la nina",
                  imageSrc: "/girl.svg",
                  audioSrc: "/es_girl.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el zombie",
                  imageSrc: "/zombie.svg",
                  audioSrc: "/es_zombie.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el hombre",
                  imageSrc: "/man.svg",
                  audioSrc: "/es_man.mp3",
                },
              ]);
            }
            if (challenge.order === 8) {
              await db.insert(schema.challengeOptions).values([
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "la mujer",
                  audioSrc: "/es_woman.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: true,
                  text: "el zombie",
                  audioSrc: "/es_zombie.mp3",
                },
                {
                  challengeId: challenge.id,
                  correct: false,
                  text: "el chico",
                  audioSrc: "/es_boy.mp3",
                },
              ]);
            }
          }
        }
      }
    }

    // Insert quiz questions and options
    const insertQuizQuestions = async (field: string, questionsData: any[]) => {
      for (const q of questionsData) {
        const insertedQuestion = await db
          .insert(schema.quizQuestions)
          .values({
            field,
            questionText: q.questionText,
          })
          .returning({ id: schema.quizQuestions.id });

        const questionId = insertedQuestion[0].id;

        const options = q.options.map((opt: any) => ({
          questionId,
          text: opt.text,
          isCorrect: opt.isCorrect,
        }));

        await db.insert(schema.quizOptions).values(options);
      }
    };

    // Define quiz questions for 'Matematik'
    const mathQuestions = [
      {
        questionText: "2 + 2 kaç eder?",
        options: [
          { text: "3", isCorrect: false },
          { text: "4", isCorrect: true },
          { text: "5", isCorrect: false },
          { text: "6", isCorrect: false }
        ]
      },
      {
        questionText: "5 x 6 kaç eder?",
        options: [
          { text: "11", isCorrect: false },
          { text: "30", isCorrect: true },
          { text: "60", isCorrect: false },
          { text: "35", isCorrect: false }
        ]
      }
    ];

    // Define quiz questions for 'Fizik'
    const physicsQuestions = [
      {
        questionText: "Işık hızı kaç km/s'dir?",
        options: [
          { text: "300.000 km/s", isCorrect: true },
          { text: "150.000 km/s", isCorrect: false },
          { text: "30.000 km/s", isCorrect: false },
          { text: "3.000 km/s", isCorrect: false }
        ]
      },
      {
        questionText: "Yerçekimi ivmesi yaklaşık kaç m/s²'dir?",
        options: [
          { text: "9.8 m/s²", isCorrect: true },
          { text: "10 m/s²", isCorrect: false },
          { text: "8.5 m/s²", isCorrect: false },
          { text: "12 m/s²", isCorrect: false }
        ]
      }
    ];

    // Insert quiz questions into the database
    await insertQuizQuestions("Matematik", mathQuestions);
    await insertQuizQuestions("Fizik", physicsQuestions);

    // Optional: Insert a sample userProgress row for testing streak functionality
    await db.insert(schema.userProgress).values([
      {
        userId: "sample-user-id",
        userName: "Sample User",
        userImageSrc: "/mascot_purple.svg",
        activeCourseId: courses[0].id,
        hearts: 5,
        points: 0,
        schoolId: schools[0].id,
        profileLocked: false,
        istikrar: 0,
        dailyTarget: 50,
        lastStreakCheck: null,
        previousTotalPoints: 0,
      }
    ]);

    console.log("Database seeded successfully");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed database");
  }
};

main();
