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
  json,
  uniqueIndex, 
  jsonb,
  index
} from "drizzle-orm/pg-core";

// Define your IUserLink type (for TypeScript)
export interface IUserLink {
  id: string;
  label: string;
  url: string;
}

// Define user roles enum
export const userRoleEnum = pgEnum("role", ["user", "teacher", "admin", "student"]);

// Define a "users" table for storing profile details
export const users = pgTable("users", {
  id: text("id").primaryKey(),              // Auth user id
  email: text("email").notNull(),
  name: text("name").notNull(),               // This holds the username
  description: text("description").default(""),
  avatar: text("avatar").default(""),
  provider: text("provider").notNull(),       // e.g., 'google' or 'email'
  links: json("links").$type<IUserLink[]>().notNull().default([]),
  role: userRoleEnum("role").default("user").notNull(),
  meetLink: text("meet_link"),                // Google Meet link for teachers
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

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
export const challengesEnum = pgEnum("type", [
  "SELECT", 
  "ASSIST", 
  "DRAG_DROP", 
  "FILL_BLANK", 
  "MATCH_PAIRS", 
  "SEQUENCE", 
  "TIMER_CHALLENGE"
]);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id, { onDelete: "cascade" })
    .notNull(),
  type: challengesEnum("type").notNull(),
  question: text("question").notNull(),
  order: integer("order").notNull(),
  // Timer configuration for TIMER_CHALLENGE type
  timeLimit: integer("time_limit"), // in seconds, null for non-timed challenges
  // Additional metadata for complex challenge types (JSON string)
  metadata: text("metadata"), // For storing type-specific configuration
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
  // Additional fields for new challenge types
  correctOrder: integer("correct_order"), // For SEQUENCE challenges
  pairId: integer("pair_id"), // For MATCH_PAIRS challenges
  isBlank: boolean("is_blank").default(false), // For FILL_BLANK challenges
  dragData: text("drag_data"), // For DRAG_DROP challenges (JSON string)
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
  city: text("city").notNull(),
  district: text("district").notNull(),
  category: text("category").notNull(), // Primary School, Secondary School, High School, University
  kind: text("kind"), // Anadolu Lisesi, İmam Hatip, etc. (can be null)
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
  //lastLessonCompletedAt: timestamp("last_lesson_completed_at"),
  dailyTarget: integer("daily_target").notNull().default(50), // Kullanıcının belirlediği günlük hedeflenen puan
  lastStreakCheck: timestamp("last_streak_check"), // En son streak kontrol tarihi
  previousTotalPoints: integer("previous_total_points").default(0), // Son kontrol anındaki toplam puan
  
  // One-time achievement unlocks - once achieved, permanently unlocked
  profileEditingUnlocked: boolean("profile_editing_unlocked").default(false).notNull(), // 30 days achievement
  studyBuddyUnlocked: boolean("study_buddy_unlocked").default(false).notNull(), // 15 days achievement  
  codeShareUnlocked: boolean("code_share_unlocked").default(false).notNull(), // 30 days achievement

  // Premium subscription fields
  hasInfiniteHearts: boolean("has_infinite_hearts").default(false).notNull(), // Whether user has active infinite hearts subscription
  subscriptionExpiresAt: timestamp("subscription_expires_at"), // When the current subscription expires
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
export const privateLessonApplications = pgTable("private_lesson_applications", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  studentSurname: text("student_surname").notNull(),
  studentPhoneNumber: text("student_phone_number").notNull(),
  studentEmail: text("student_email").notNull(),
  field: text("field").notNull(),
  studentNeeds: text("student_needs"),
  userId: text("user_id"),
  status: text("status").default("pending"),
  approved: boolean("approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const privateLessonApplicationsRelations = relations(privateLessonApplications, ({}) => ({}));

// Teacher Applications (Öğretmen Başvuruları)
export const applicationStatusEnum = pgEnum("status", ["pending", "approved", "rejected"]);

export const teacherApplications = pgTable("teacher_applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  field: text("field").notNull(),
  // NOTE: The following quiz-related fields are kept for database compatibility
  // but are no longer used in the application. All teachers are auto-approved
  // with quizResult=0 and passed=true
  quizResult: integer("quiz_result").notNull().default(0),
  passed: boolean("passed").notNull().default(true),
  teacherName: text("teacher_name"),
  teacherSurname: text("teacher_surname"),
  teacherPhoneNumber: text("teacher_phone_number"),
  teacherEmail: text("teacher_email"),
  classification: text("classification"),
  status: applicationStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teacherApplicationsRelations = relations(teacherApplications, ({ one }) => ({
  user: one(users, {
    fields: [teacherApplications.userId],
    references: [users.id],
  }),
}));

// DEPRECATED: English Group Applications (İngilizce Konuşma Grubu Başvuruları)
// This feature is no longer used but the table is kept for database compatibility
export const englishGroupApplications = pgTable("english_group_applications", {
  id: serial("id").primaryKey(),
  participantName: text("participant_name").notNull(),
  participantSurname: text("participant_surname").notNull(),
  participantPhoneNumber: text("participant_phone_number").notNull(),
  participantEmail: text("participant_email").notNull(),
  quizResult: integer("quiz_result").notNull().default(0),
  classification: text("classification").default(""),
});

export const englishGroupApplicationsRelations = relations(englishGroupApplications, ({}) => ({}));

// DEPRECATED: Quiz Questions and Options
// These tables are no longer used but kept for database compatibility
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


// Study Buddy Posts
export const studyBuddyPosts = pgTable("study_buddy_posts", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(), // references auth user id
  purpose: text("purpose").notNull(),
  reason: text("reason").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Study Buddy Chats
// We store participants as JSON (an array of user IDs)
export const studyBuddyChats = pgTable("study_buddy_chats", {
  id: serial("id").primaryKey(),
  participants: jsonb("participants").$type<string[]>().notNull(),
  last_message: text("last_message").default(""),
  last_updated: timestamp("last_updated").defaultNow().notNull(),
}, (table) => ({
  participantsIdx: index("participants_idx").using("gin", table.participants)
}));

// Study Buddy Messages
export const studyBuddyMessages = pgTable("study_buddy_messages", {
  id: serial("id").primaryKey(),
  chat_id: integer("chat_id")
    .references(() => studyBuddyChats.id, { onDelete: "cascade" })
    .notNull(),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Optionally, you can define relations for these new tables:
export const studyBuddyPostsRelations = relations(studyBuddyPosts, ({ one }) => ({
  user: one(users, {
    fields: [studyBuddyPosts.user_id],
    references: [users.id],
  }),
}));

export const studyBuddyChatsRelations = relations(studyBuddyChats, ({ many }) => ({
  messages: many(studyBuddyMessages),
}));

export const studyBuddyMessagesRelations = relations(studyBuddyMessages, ({ one }) => ({
  chat: one(studyBuddyChats, {
    fields: [studyBuddyMessages.chat_id],
    references: [studyBuddyChats.id],
  }),
}));

// Daily Streak
export const userDailyStreak = pgTable("user_daily_streak", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  // Store the day (date only; no time)
  date: timestamp("date").notNull(),
  achieved: boolean("achieved").notNull().default(false),
});
export const userDailyStreakRelations = relations(userDailyStreak, ({ one }) => ({
  user: one(users, {
    fields: [userDailyStreak.userId],
    references: [users.id],
  }),
}));

// Teacher Availability
export const teacherAvailability = pgTable("teacher_availability", {
  id: serial("id").primaryKey(),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 for Sunday, 1 for Monday, etc.
  weekStartDate: timestamp("week_start_date").notNull(), // Store the start date of the week this availability belongs to
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teacherAvailabilityRelations = relations(teacherAvailability, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherAvailability.teacherId],
    references: [users.id],
  }),
}));

// Lesson Bookings
export const lessonBookings = pgTable("lesson_bookings", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  meetLink: text("meet_link"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessonBookingsRelations = relations(lessonBookings, ({ one }) => ({
  student: one(users, {
    fields: [lessonBookings.studentId],
    references: [users.id],
    relationName: "student_bookings",
  }),
  teacher: one(users, {
    fields: [lessonBookings.teacherId],
    references: [users.id],
    relationName: "teacher_bookings",
  }),
  review: one(lessonReviews, {
    fields: [lessonBookings.id],
    references: [lessonReviews.bookingId],
  }),
}));

// Lesson Reviews
export const lessonReviews = pgTable("lesson_reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => lessonBookings.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessonReviewsRelations = relations(lessonReviews, ({ one }) => ({
  booking: one(lessonBookings, {
    fields: [lessonReviews.bookingId],
    references: [lessonBookings.id],
  }),
  student: one(users, {
    fields: [lessonReviews.studentId],
    references: [users.id],
    relationName: "student_reviews",
  }),
  teacher: one(users, {
    fields: [lessonReviews.teacherId],
    references: [users.id],
    relationName: "teacher_reviews",
  }),
}));

// Teacher Fields - Support multiple fields with grades for each teacher
export const teacherFields = pgTable("teacher_fields", {
  id: serial("id").primaryKey(),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(), // e.g., "Matematik", "Fizik", etc.
  grade: text("grade").notNull(), // e.g., "5.sınıf", "6.sınıf", "7.sınıf", etc.
  displayName: text("display_name").notNull(), // e.g., "Matematik 8.sınıf"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teacherFieldsRelations = relations(teacherFields, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherFields.teacherId],
    references: [users.id],
  }),
}));

// Credit System Tables

// User Credits - stores total available credits per user
export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalCredits: integer("total_credits").notNull().default(0),
  usedCredits: integer("used_credits").notNull().default(0),
  availableCredits: integer("available_credits").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userCreditsRelations = relations(userCredits, ({ one }) => ({
  user: one(users, {
    fields: [userCredits.userId],
    references: [users.id],
  }),
}));

// Credit Transactions - transaction log per credit purchase
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paymentId: text("payment_id").notNull(), // Iyzico payment ID
  creditsAmount: integer("credits_amount").notNull(),
  totalPrice: text("total_price").notNull(), // Store as string to preserve decimal precision
  currency: text("currency").notNull().default("TRY"),
  status: text("status").notNull().default("pending"), // pending, success, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

// Payment Logs - stores raw Iyzico responses for debugging/auditing
export const paymentLogs = pgTable("payment_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paymentId: text("payment_id").notNull(),
  requestData: jsonb("request_data").notNull(),
  responseData: jsonb("response_data").notNull(),
  status: text("status").notNull(),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentLogsRelations = relations(paymentLogs, ({ one }) => ({
  user: one(users, {
    fields: [paymentLogs.userId],
    references: [users.id],
  }),
}));

// User Subscriptions - tracks monthly subscription payments
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionType: text("subscription_type").notNull().default("infinite_hearts"), // Type of subscription
  status: text("status").notNull().default("active"), // active, expired, cancelled
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  paymentId: text("payment_id"), // Iyzico payment ID for this month
  amount: text("amount").notNull().default("100"), // Monthly amount (100 TL)
  currency: text("currency").notNull().default("TRY"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
}));