// db/schema.ts
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex 
} from "drizzle-orm/pg-core";

// Courses
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageSrc: text("image_src").notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  userProgress: many(userProgress),
  units: many(units),
}));

// Units
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  courseId: integer("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
});

export const unitRelations = relations(units, ({ many, one }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

// Lessons
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  unitId: integer("unit_id")
    .references(() => units.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, {
    fields: [lessons.unitId],
    references: [units.id],
  }),
  challenges: many(challenges),
}));

// Challenges
export const challengesEnum = pgEnum("type", ["SELECT", "ASSIST"]);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id, { onDelete: "cascade" })
    .notNull(),
  type: challengesEnum("type").notNull(),
  question: text("question").notNull(),
  order: integer("order").notNull(),
});

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [challenges.lessonId],
    references: [lessons.id],
  }),
  challengeOptions: many(challengeOptions),
  challengeProgress: many(challengeProgress),
}));

// Challenge Options
export const challengeOptions = pgTable("challenge_options", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id")
    .references(() => challenges.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  correct: boolean("correct").notNull(),
  imageSrc: text("image_src"),
  audioSrc: text("audio_src"),
});

export const challengeOptionsRelations = relations(challengeOptions, ({ one, many }) => ({
  challenges: one(challenges, {
    fields: [challengeOptions.challengeId],
    references: [challenges.id],
  }),
}));

// Challenge Progress
export const challengeProgress = pgTable("challenge_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  challengeId: integer("challenge_id")
    .references(() => challenges.id, { onDelete: "cascade" })
    .notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const challengeProgressRelations = relations(challengeProgress, ({ one, many }) => ({
  challenges: one(challenges, {
    fields: [challengeProgress.challengeId],
    references: [challenges.id],
  }),
}));

// Schools
export const schoolTypeEnum = pgEnum("school_type", [
  "university",
  "high_school",
  "secondary_school",
  "elementary_school",
]);

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  totalPoints: integer("total_points").notNull().default(0),
  type: schoolTypeEnum("type").notNull().default("elementary_school"),
});

export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(userProgress),
}));

// User Progress
export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull().default("User"),
  userImageSrc: text("user_image_src").notNull().default("/mascot_purple.svg"),
  activeCourseId: integer("active_course_id")
    .references(() => courses.id, { onDelete: "cascade" }),
  hearts: integer("hearts").notNull().default(5),
  points: integer("points").notNull().default(0),
  schoolId: integer("school_id")
    .references(() => schools.id, { onDelete: "set null" }),
  profileLocked: boolean("profileLocked").default(false).notNull(),
  istikrar: integer("istikrar").notNull().default(0),
  lastLessonCompletedAt: timestamp("last_lesson_completed_at"),
});

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  activeCourse: one(courses, {
    fields: [userProgress.activeCourseId],
    references: [courses.id],
  }),
  school: one(schools, {
    fields: [userProgress.schoolId],
    references: [schools.id],
  }),
}));

// Private Lesson Applications (Öğrenci Başvuruları)
// (priceRange is required)
export const privateLessonApplications = pgTable("private_lesson_applications", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  studentSurname: text("student_surname").notNull(),
  studentPhoneNumber: text("student_phone_number").notNull(),
  studentEmail: text("student_email").notNull(),
  field: text("field").notNull(),
  priceRange: text("price_range").notNull(),
  studentNeeds: text("student_needs"),
});

export const privateLessonApplicationsRelations = relations(privateLessonApplications, ({}) => ({}));

// Teacher Applications (Öğretmen Başvuruları)
// (priceRange is required and classification is stored as well)
export const teacherApplications = pgTable("teacher_applications", {
  id: serial("id").primaryKey(),
  field: text("field").notNull(),
  quizResult: integer("quiz_result").notNull().default(0),
  passed: boolean("passed").notNull().default(false),
  teacherName: text("teacher_name"),
  teacherSurname: text("teacher_surname"),
  teacherPhoneNumber: text("teacher_phone_number"),
  teacherEmail: text("teacher_email"),
  priceRange: text("price_range").notNull(),
  classification: text("classification"),
});

export const teacherApplicationsRelations = relations(teacherApplications, ({}) => ({}));

// English Group Applications (İngilizce Konuşma Grubu Başvuruları)
export const englishGroupApplications = pgTable("english_group_applications", {
  id: serial("id").primaryKey(),
  participantName: text("participant_name").notNull(),
  participantSurname: text("participant_surname").notNull(),
  participantPhoneNumber: text("participant_phone_number").notNull(),
  participantEmail: text("participant_email").notNull(),
  quizResult: integer("quiz_result").notNull().default(0),
  // Now store classification as e.g. A1..C2 or '' if not assigned
  classification: text("classification").default(""),
});

export const englishGroupApplicationsRelations = relations(englishGroupApplications, ({}) => ({}));

// Quiz Questions and Options
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  field: text("field").notNull(),
  questionText: text("question_text").notNull(),
});

export const quizQuestionsRelations = relations(quizQuestions, ({ many }) => ({
  options: many(quizOptions),
}));

export const quizOptions = pgTable("quiz_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .references(() => quizQuestions.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
});

export const quizOptionsRelations = relations(quizOptions, ({ one }) => ({
  question: one(quizQuestions, {
    fields: [quizOptions.questionId],
    references: [quizQuestions.id],
  }),
}));

// Code Editor
export const snippets = pgTable("snippets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  language: text("language").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const snippetsRelations = relations(snippets, ({ one }) => ({
  user: one(userProgress, {
    fields: [snippets.userId],
    references: [userProgress.userId],
  }),
}));
