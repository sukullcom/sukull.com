// db/schema.ts
import { relations, sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  json,
  uniqueIndex,
  jsonb,
  index,
  primaryKey,
  type AnyPgColumn,
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
  /** Shown to the other party after private-lesson unlock or listing offer. */
  phone: text("phone"),
  role: userRoleEnum("role").default("user").notNull(),
  /**
   * Çoklu rol — `user` + `student` varsayılan; onaylı eğitmen `teacher`, env admin `admin` eklenir.
   * `role` sütunu birincil özet (geriye dönük uyumluluk).
   */
  roles: text("roles")
    .array()
    .notNull()
    .default(sql`ARRAY['user','student']::text[]`),
  /** Paylaşılabilir davet kodu (ör. SK + 8 hex). */
  referralCode: text("referral_code").notNull(),
  /** Bu hesabı hangi kullanıcının davetiyle açtığı (bir kez, değişmez). */
  referredByUserId: text("referred_by_user_id").references((): AnyPgColumn => users.id, {
    onDelete: "set null",
  }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("idx_users_email").on(table.email),
  roleIdx: index("idx_users_role").on(table.role),
  referralCodeKey: uniqueIndex("users_referral_code_key").on(table.referralCode),
  referredByIdx: index("idx_users_referred_by_user_id").on(table.referredByUserId),
}));

export const referralRewards = pgTable(
  "referral_rewards",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    referrerUserId: text("referrer_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    /** Silinen hesapta NULL kalır; ödül kaydı ve sayaç korunur. */
    refereeUserId: text("referee_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Aynı davet edilen kişi (e-posta) için tek ödül — yeniden kayıt engeli. */
    refereeEmailNormalized: text("referee_email_normalized").notNull(),
    referrerPoints: integer("referrer_points").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    refereeUserUnique: uniqueIndex("referral_rewards_referee_user_unique")
      .on(table.refereeUserId)
      .where(sql`referee_user_id IS NOT NULL`),
    referrerRefereeEmailUnique: uniqueIndex(
      "referral_rewards_referrer_referee_email_key",
    ).on(table.referrerUserId, table.refereeEmailNormalized),
    referrerIdx: index("referral_rewards_referrer_idx").on(table.referrerUserId),
  }),
);

export const referralRewardsRelations = relations(referralRewards, ({ one }) => ({
  referrer: one(users, {
    fields: [referralRewards.referrerUserId],
    references: [users.id],
    relationName: "referralAsReferrer",
  }),
  referee: one(users, {
    fields: [referralRewards.refereeUserId],
    references: [users.id],
    relationName: "referralAsReferee",
  }),
}));

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
}, (table) => ({
  courseIdx: index("idx_units_course_id").on(table.courseId),
}));

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
}, (table) => ({
  unitIdx: index("idx_lessons_unit_id").on(table.unitId),
}));

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

export const difficultyEnum = pgEnum("difficulty", ["EASY", "MEDIUM", "HARD"]);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .references(() => lessons.id, { onDelete: "cascade" })
    .notNull(),
  type: challengesEnum("type").notNull(),
  question: text("question").notNull(),
  questionImageSrc: text("question_image_src"),
  explanation: text("explanation"),
  order: integer("order").notNull(),
  difficulty: difficultyEnum("difficulty"),
  tags: text("tags"),
  timeLimit: integer("time_limit"),
  metadata: text("metadata"),
}, (table) => ({
  lessonIdx: index("idx_challenges_lesson_id").on(table.lessonId),
}));

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
}, (table) => ({
  challengeIdx: index("idx_challenge_options_challenge_id").on(table.challengeId),
}));

export const challengeOptionsRelations = relations(challengeOptions, ({ one }) => ({
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
  correctCount: integer("correct_count").notNull().default(0),
  incorrectCount: integer("incorrect_count").notNull().default(0),
  lastAttemptedAt: timestamp("last_attempted_at"),
  firstCompletedAt: timestamp("first_completed_at"),
}, (table) => ({
  userIdx: index("idx_challenge_progress_user_id").on(table.userId),
  // 0045 ile UNIQUE'e yükseltildi. Adı, eski non-unique idx adına benzer
  // tutuldu ki migration tarihçesi okunur kalsın.
  userChallengeUniq: uniqueIndex("idx_challenge_progress_user_challenge_uniq").on(
    table.userId,
    table.challengeId,
  ),
}));

export const challengeProgressRelations = relations(challengeProgress, ({ one }) => ({
  challenges: one(challenges, {
    fields: [challengeProgress.challengeId],
    references: [challenges.id],
  }),
}));

/**
 * Ders tamamlama bonusu için idempotency kaydı.
 * `(userId, lessonId)` UNIQUE — aynı ders için bonus en çok bir kez verilir.
 * `awardLessonCompletionBonus` `INSERT ... ON CONFLICT DO NOTHING RETURNING`
 * ile yazar; 0 satır → bonus zaten verilmiş, idempotent çıkış.
 */
export const lessonCompletionBonuses = pgTable(
  "lesson_completion_bonuses",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id").notNull(),
    lessonId: integer("lesson_id")
      .references(() => lessons.id, { onDelete: "cascade" })
      .notNull(),
    wrongCount: integer("wrong_count").notNull().default(0),
    completionBonus: integer("completion_bonus").notNull().default(0),
    perfectBonus: integer("perfect_bonus").notNull().default(0),
    totalAwarded: integer("total_awarded").notNull().default(0),
    awardedAt: timestamp("awarded_at").notNull().defaultNow(),
  },
  (table) => ({
    userLessonUniq: uniqueIndex("idx_lesson_completion_bonuses_user_lesson").on(
      table.userId,
      table.lessonId,
    ),
    userIdx: index("idx_lesson_completion_bonuses_user_id").on(table.userId),
  }),
);

// Schools
export const schoolTypeEnum = pgEnum("school_type", [
  "university",
  "high_school",
  "secondary_school",
  "elementary_school",
]);

export const schools = pgTable(
  "schools",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    category: text("category").notNull(), // Primary School, Secondary School, High School, University
    kind: text("kind"), // Anadolu Lisesi, İmam Hatip, etc. (can be null)
    /**
     * Aktif öğrencilerin (son 30 gün) toplam puanı. Görüntü / admin için
     * korunuyor; sıralamayı artık `topAvgScore` belirliyor.
     */
    totalPoints: integer("total_points").notNull().default(0),
    type: schoolTypeEnum("type").notNull().default("elementary_school"),
    /** Son 30 günde puan üreten öğrenci sayısı (cron her gece yeniler). */
    activeStudentCount: integer("active_student_count").notNull().default(0),
    /** Aktif öğrencilerin ham ortalama puanı (regülarize edilmemiş). */
    rawAvgPoints: numeric("raw_avg_points", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    /**
     * Bayesian shrinkage uygulanmış skor — okul büyüklüğünden bağımsız
     * adil sıralama. Bkz. migration 0053.
     */
    topAvgScore: numeric("top_avg_score", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
  },
  (table) => ({
    /**
     * Okul arama (/api/schools) ve liderlik: city, district, category, ILIKE name, type+points.
     * SQL migration’larla aynı isimler (0006, 0025, 0035, 0036) — `drizzle-kit push` veya
     * `npm run db:apply` sonrası canlıda `pg_indexes` ile doğrulayın. Eski “schools’ta indeks
     * yok” değerlendirmesi bu dosyanın eski hâline veya migration’ların uygulanmamasına işaret eder.
     */
    schoolsCityIdx: index("idx_schools_city").on(table.city),
    schoolsDistrictIdx: index("idx_schools_district").on(table.district),
    schoolsCategoryIdx: index("idx_schools_category").on(table.category),
    schoolsKindIdx: index("idx_schools_kind").on(table.kind),
    schoolsLocationSearchIdx: index("idx_schools_location_search").on(
      table.city,
      table.district,
    ),
    schoolsCityDistrictCategoryIdx: index("idx_schools_city_district_category").on(
      table.city,
      table.district,
      table.category,
    ),
    schoolsTotalPointsIdx: index("idx_schools_total_points").on(
      sql`${table.totalPoints} DESC`,
    ),
    schoolsTypePointsIdx: index("idx_schools_type_points").on(
      table.type,
      sql`${table.totalPoints} DESC`,
    ),
    schoolsTypeCityPointsIdx: index("idx_schools_type_city_points").on(
      table.type,
      table.city,
      sql`${table.totalPoints} DESC`,
    ),
    schoolsNameTrgmIdx: index("idx_schools_name_trgm").using(
      "gin",
      table.name.op("gin_trgm_ops"),
    ),
    /** Prefix / pattern LIKE yardımı; ILIKE '%...%' için asıl yük `schoolsNameTrgmIdx`. */
    schoolsNameIlikeIdx: index("idx_schools_name_ilike").using(
      "btree",
      table.name.asc().op("text_pattern_ops"),
    ),
    /** 0006 ile aynı ifade; İngilizce tsconfig (okul adları çoğunlukla özel ad). */
    schoolsNameSearchIdx: index("idx_schools_name_search").using(
      "gin",
      sql`to_tsvector('english', ${table.name})`,
    ),
  }),
);

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
  dailyTarget: integer("daily_target").notNull().default(50), // Kullanıcının belirlediği günlük hedeflenen puan
  lastStreakCheck: timestamp("last_streak_check"), // En son streak kontrol tarihi
  previousTotalPoints: integer("previous_total_points").default(0), // Son kontrol anındaki toplam puan
  /** Türkiye gününe göre, bugünkü puan oyun/ödül/ceza toplamı; gece/ensureNewDay ile 0'lanır (istikrar bonusu buraya eklenmez). */
  dailyPointsEarned: integer("daily_points_earned").notNull().default(0),
  lastHeartRegenAt: timestamp("last_heart_regen_at"), // Ücretsiz tam dolum için ankor (yakl. 24s aralık)
  streakFreezeCount: integer("streak_freeze_count").notNull().default(0), // Satın alınan streak freeze sayısı

  // One-time achievement unlocks - once achieved, permanently unlocked
  profileEditingUnlocked: boolean("profile_editing_unlocked").default(false).notNull(), // 30 days achievement
  studyBuddyUnlocked: boolean("study_buddy_unlocked").default(false).notNull(), // 15 days achievement  
  codeShareUnlocked: boolean("code_share_unlocked").default(false).notNull(), // 30 days achievement

  // Premium subscription fields
  hasInfiniteHearts: boolean("has_infinite_hearts").default(false).notNull(), // Whether user has active infinite hearts subscription
  subscriptionExpiresAt: timestamp("subscription_expires_at"), // When the current subscription expires

  /**
   * Öğrenme yolu: `full` = tüm katalog (eski hesaplar); `lgs` = 5–8, `tyt_ayt` = 9–12, `adult` = KPSS/YDT/ALES/YDS bantı
   */
  learningPath: text("learning_path"),
  studentGrade: integer("student_grade"), // 5–12, yetişkin yolunda null
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  learningPathLastSetAt: timestamp("learning_path_last_set_at"),
  learningPathChangeCount: integer("learning_path_change_count").notNull().default(0),

  /** Okul değiştirmek için izin verilen zaman (öncesinde engelli). */
  schoolChangeLockedUntil: timestamp("school_change_locked_until"),
  /** Sınıf (student_grade) değiştirilemez; sonraki izin anı. */
  studentGradeChangeLockedUntil: timestamp("student_grade_change_locked_until"),

  /** Ardışık ilk-denemede-doğru (yanlışta sıfırlanır); rozetler için anlık seri. */
  currentAnswerStreak: integer("current_answer_streak").notNull().default(0),
  /** Tüm zamanların en uzun hatasız soru serisi (ilk denemede doğru zinciri). */
  maxAnswerStreak: integer("max_answer_streak").notNull().default(0),

  /**
   * `applyDailyStreakBonuses` günde tek kez bonus eklesin diye gate kolonu
   * (0046). Cron iki kez tetiklenirse (Vercel retry, manuel + scheduled
   * çakışması) çift bonus oluşmaz; UPDATE bu kolonu `CURRENT_DATE` yapar.
   */
  lastStreakBonusDate: timestamp("last_streak_bonus_date", { mode: "date" }),
}, (table) => ({
  schoolIdx: index("idx_user_progress_school_id").on(table.schoolId),
  activeCourseIdx: index("idx_user_progress_active_course").on(table.activeCourseId),
  pointsIdx: index("idx_user_progress_points").on(table.points),
}));

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

// Teacher Applications (Eğitmen Başvuruları)
export const applicationStatusEnum = pgEnum("status", ["pending", "approved", "rejected"]);

export const teacherApplications = pgTable("teacher_applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  field: text("field").notNull(),
  quizResult: integer("quiz_result").notNull().default(0),
  passed: boolean("passed").notNull().default(true),
  teacherName: text("teacher_name"),
  teacherSurname: text("teacher_surname"),
  teacherPhoneNumber: text("teacher_phone_number"),
  teacherEmail: text("teacher_email"),
  education: text("education"),
  /** Mezun olunan üniversite (schools tablosundan seçilen ad). */
  university: text("university"),
  /** Mezun olunan bölüm — serbest metin (örn. "Bilgisayar Mühendisliği"). */
  universityDepartment: text("university_department"),
  experienceYears: text("experience_years"),
  targetLevels: text("target_levels"),
  availableHours: text("available_hours"),
  lessonMode: text("lesson_mode"), // 'online' | 'in_person' | 'both'
  hourlyRate: text("hourly_rate"), // legacy combined rate (kept for back-compat)
  hourlyRateOnline: integer("hourly_rate_online"), // ₺ per hour, online lessons
  hourlyRateInPerson: integer("hourly_rate_in_person"), // ₺ per hour, face-to-face lessons
  city: text("city"),
  district: text("district"),
  bio: text("bio"),
  classification: text("classification"),
  /** Eğitmenin başvuruda seçtiği ders + sınıf çiftleri; onayda `teacher_fields` üretilir. */
  capabilitiesJson: jsonb("capabilities_json")
    .$type<Array<{ subject: string; grade: string }>>()
    .notNull()
    .default([]),
  status: applicationStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_teacher_apps_user").on(table.userId),
  statusIdx: index("idx_teacher_apps_status").on(table.status),
  userStatusIdx: index("idx_teacher_apps_user_status").on(table.userId, table.status),
}));

export const teacherApplicationsRelations = relations(teacherApplications, ({ one }) => ({
  user: one(users, {
    fields: [teacherApplications.userId],
    references: [users.id],
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
  /** Gönderi oluşturulurken kullanıcının öğrenme yolu (segment filtresi). */
  learningPath: text("learning_path").notNull().default("full"),
}, (table) => ({
  userIdx: index("idx_study_buddy_posts_user").on(table.user_id),
  createdIdx: index("idx_study_buddy_posts_created").on(table.created_at),
  learningPathIdx: index("idx_study_buddy_posts_learning_path").on(table.learningPath),
}));

// Study Buddy Chats
// We store participants as JSON (an array of user IDs)
export const studyBuddyChats = pgTable("study_buddy_chats", {
  id: serial("id").primaryKey(),
  participants: jsonb("participants").$type<string[]>().notNull(),
  /** İki kişilik sohbetlerde lexicographic min/max; DB trigger doldurur — `0037`. */
  participantSortedA: text("participant_sorted_a"),
  participantSortedB: text("participant_sorted_b"),
  last_message: text("last_message").default(""),
  last_updated: timestamp("last_updated").defaultNow().notNull(),
}, (table) => ({
  participantsIdx: index("participants_idx").using("gin", table.participants),
  /**
   * Tam iki kullanıcı için sıra-bağımsız tek satır (yarış: çift eşzamanlı unlock).
   * Migration: `0037_study_buddy_chats_unique_two_user_pair.sql` (sütun + trigger + indeks).
   */
  twoUserCanonicalPairIdx: uniqueIndex("idx_study_buddy_chats_two_user_canonical_pair")
    .on(table.participantSortedA, table.participantSortedB)
    .where(
      sql`${table.participantSortedA} IS NOT NULL AND ${table.participantSortedB} IS NOT NULL`,
    ),
  /**
   * Sohbet listesinde GIN `@>` containment filtresi + `ORDER BY last_updated DESC`
   * sıralaması yapılıyor (`db/queries/messages.ts` — `listConversationsFor`). GIN
   * sıralamayı destekleyemediği için Postgres sort adımı atıyor; bu indeks aynı
   * tabloda zaman bazlı taramalar için yararlanılan ek sıralı yol. Migration 0047.
   */
  lastUpdatedIdx: index("idx_study_buddy_chats_last_updated").on(table.last_updated),
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
}, (table) => ({
  chatCreatedIdx: index("idx_study_buddy_messages_chat_created").on(table.chat_id, table.created_at),
}));

// Optionally, you can define relations for these new tables:
export const studyBuddyPostsRelations = relations(studyBuddyPosts, ({ one }) => ({
  user: one(users, {
    fields: [studyBuddyPosts.user_id],
    references: [users.id],
  }),
}));

/**
 * İlk mesaj e-posta bildirimi idempotency anahtarı.
 * `chat_id` PRIMARY KEY → aynı sohbet için en çok bir kez e-posta gider.
 * `notifyFirstMessageIfApplicable` `INSERT … ON CONFLICT DO NOTHING RETURNING`
 * ile bu satırı yazar; 0 satır → e-posta daha önce yollanmış, no-op.
 */
export const chatFirstMessageNotifications = pgTable(
  "chat_first_message_notifications",
  {
    chatId: integer("chat_id")
      .primaryKey()
      .references(() => studyBuddyChats.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id").notNull(),
    senderId: text("sender_id").notNull(),
    context: text("context").notNull().default("study-buddy"),
    notifiedAt: timestamp("notified_at").notNull().defaultNow(),
  },
  (table) => ({
    recipientIdx: index("idx_chat_first_msg_notif_recipient").on(table.recipientId),
  }),
);

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
  date: timestamp("date").notNull(),
  achieved: boolean("achieved").notNull().default(false),
}, (table) => [
  uniqueIndex("user_daily_streak_user_date_idx").on(table.userId, table.date),
  index("idx_user_daily_streak_user").on(table.userId, table.date),
]);
export const userDailyStreakRelations = relations(userDailyStreak, ({ one }) => ({
  user: one(users, {
    fields: [userDailyStreak.userId],
    references: [users.id],
  }),
}));

// Daily Challenges
export const userDailyChallenges = pgTable("user_daily_challenges", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  challengeDay: integer("challenge_day").notNull(),
  progress: integer("progress").notNull().default(0),
  target: integer("target").notNull(),
  completed: boolean("completed").notNull().default(false),
  rewardClaimed: boolean("reward_claimed").notNull().default(false),
  bonusPoints: integer("bonus_points").notNull().default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
}, (table) => ({
  userDateIdx: uniqueIndex("user_daily_challenges_user_date_idx").on(table.userId, table.date),
}));

export const userDailyChallengesRelations = relations(userDailyChallenges, ({ one }) => ({
  user: one(users, {
    fields: [userDailyChallenges.userId],
    references: [users.id],
  }),
}));

// Private-lesson marketplace: student listings ("İlan")
//
// A student opens a listing describing what they need; approved teachers
// can browse open listings and spend credits to offer. A listing caps at
// MAX_OFFERS_PER_LISTING (4) active offers — enforced at the action layer
// plus a DB-level check via a trigger (see migration 0026).
export const listingStatusEnum = pgEnum("listing_status", [
  "open",
  "closed",
  "expired",
  "pending_review",
  "rejected",
]);

export const listingLessonModeEnum = pgEnum("listing_lesson_mode", [
  "online",
  "in_person",
  "both",
]);

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  grade: text("grade"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  lessonMode: listingLessonModeEnum("lesson_mode").notNull().default("online"),
  city: text("city"),
  district: text("district"),
  budgetMin: integer("budget_min"), // ₺ per hour lower bound (optional)
  budgetMax: integer("budget_max"), // ₺ per hour upper bound (optional)
  preferredHours: text("preferred_hours"), // free-form: "hafta içi akşam"
  status: listingStatusEnum("status").notNull().default("pending_review"),
  offerCount: integer("offer_count").notNull().default(0), // denormalized for cheap reads
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  studentIdx: index("idx_listings_student").on(table.studentId),
  statusCreatedIdx: index("idx_listings_status_created").on(table.status, table.createdAt),
  subjectStatusIdx: index("idx_listings_subject_status").on(table.subject, table.status),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  student: one(users, {
    fields: [listings.studentId],
    references: [users.id],
  }),
  offers: many(listingOffers),
}));

// Listing offers — a teacher's bid on a student's listing. Max 4 per listing.
export const offerStatusEnum = pgEnum("offer_status", [
  "pending",
  "withdrawn",
  "accepted",
  "rejected",
]);

export const listingOffers = pgTable("listing_offers", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  priceProposal: integer("price_proposal").notNull(), // ₺ per hour
  note: text("note"),
  status: offerStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // One pending offer per teacher per listing
  listingTeacherIdx: uniqueIndex("idx_listing_offers_listing_teacher").on(table.listingId, table.teacherId),
  teacherIdx: index("idx_listing_offers_teacher").on(table.teacherId),
  listingStatusIdx: index("idx_listing_offers_listing_status").on(table.listingId, table.status),
  teacherStatusIdx: index("idx_listing_offers_teacher_status").on(table.teacherId, table.status),
}));

/** Single review per (student, teacher) after accepted offer or two-way messaging. */
export const teacherReviews = pgTable("teacher_reviews", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  offerId: integer("offer_id").references(() => listingOffers.id, { onDelete: "set null" }),
  rating: smallint("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  studentTeacherUniq: uniqueIndex("teacher_reviews_student_teacher_uidx").on(
    table.studentId,
    table.teacherId,
  ),
  teacherRatingIdx: index("idx_teacher_reviews_teacher_rating").on(table.teacherId, table.rating),
}));

export const listingOffersRelations = relations(listingOffers, ({ one, many }) => ({
  listing: one(listings, {
    fields: [listingOffers.listingId],
    references: [listings.id],
  }),
  teacher: one(users, {
    fields: [listingOffers.teacherId],
    references: [users.id],
  }),
  reviews: many(teacherReviews),
}));

export const teacherReviewsRelations = relations(teacherReviews, ({ one }) => ({
  offer: one(listingOffers, {
    fields: [teacherReviews.offerId],
    references: [listingOffers.id],
  }),
  teacherUser: one(users, {
    fields: [teacherReviews.teacherId],
    references: [users.id],
    relationName: "teacher_reviews_teacher_user",
  }),
  studentUser: one(users, {
    fields: [teacherReviews.studentId],
    references: [users.id],
    relationName: "teacher_reviews_student_user",
  }),
}));

// Message unlocks — once a student spends a credit to message a teacher, the
// thread stays open permanently. Unique per (student, teacher) pair.
export const messageUnlocks = pgTable("message_unlocks", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  chatId: integer("chat_id"), // optional back-ref to studyBuddyChats.id
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pairIdx: uniqueIndex("idx_message_unlocks_pair").on(table.studentId, table.teacherId),
  teacherIdx: index("idx_message_unlocks_teacher").on(table.teacherId),
}));

export const messageUnlocksRelations = relations(messageUnlocks, ({ one }) => ({
  student: one(users, {
    fields: [messageUnlocks.studentId],
    references: [users.id],
    relationName: "message_unlocks_student",
  }),
  teacher: one(users, {
    fields: [messageUnlocks.teacherId],
    references: [users.id],
    relationName: "message_unlocks_teacher",
  }),
}));

// Credit usage log — every time we deduct from userCredits we write a row
// here so we can audit, refund, and report ("how many credits were spent
// on listing offers this month?"). userCredits stays a single balance.
export const creditUsageReasonEnum = pgEnum("credit_usage_reason", [
  "message_unlock",
  "listing_offer",
]);

export const creditUsage = pgTable("credit_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: creditUsageReasonEnum("reason").notNull(),
  creditsUsed: integer("credits_used").notNull().default(1),
  refType: text("ref_type"), // 'listing' | 'teacher' etc.
  refId: text("ref_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index("idx_credit_usage_user_created").on(table.userId, table.createdAt),
  reasonIdx: index("idx_credit_usage_reason").on(table.reason, table.createdAt),
}));

export const creditUsageRelations = relations(creditUsage, ({ one }) => ({
  user: one(users, {
    fields: [creditUsage.userId],
    references: [users.id],
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
}, (table) => ({
  teacherIdx: index("idx_teacher_fields_teacher").on(table.teacherId),
  activeIdx: index("idx_teacher_fields_active").on(table.teacherId, table.isActive),
}));

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
}, (table) => ({
  userIdIdx: uniqueIndex("idx_user_credits_user_id").on(table.userId),
}));

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
  paymentId: text("payment_id").notNull(),
  creditsAmount: integer("credits_amount").notNull(),
  totalPrice: text("total_price").notNull(),
  currency: text("currency").notNull().default("TRY"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_credit_tx_user_id").on(table.userId),
  userCreatedIdx: index("idx_credit_tx_user_created").on(table.userId, table.createdAt),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

/**
 * Admin'in manuel olarak yaptığı kredi ayarlamalarının defteri.
 *  - `creditTransactions` ödeme bazlı satın alımları kayıt altına alır.
 *  - `creditAdjustments` ödeme dışı hareketleri (hediye, iade, düzeltme).
 *  - `delta` pozitifse verme, negatifse düşürme.
 *  - `balanceAfter` işlemden sonraki `available_credits`; geçmiş bakiye
 *    izini takip için.
 *  - Aynı işlem ayrıca `admin_audit`'a da yazılır (forensic trail).
 */
export const creditAdjustments = pgTable(
  "credit_adjustments",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    adminId: text("admin_id").notNull(),
    adminEmail: text("admin_email"),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx: index("idx_credit_adjustments_user_created").on(
      table.userId,
      table.createdAt,
    ),
    adminCreatedIdx: index("idx_credit_adjustments_admin_created").on(
      table.adminId,
      table.createdAt,
    ),
  }),
);

export const creditAdjustmentsRelations = relations(
  creditAdjustments,
  ({ one }) => ({
    user: one(users, {
      fields: [creditAdjustments.userId],
      references: [users.id],
    }),
  }),
);

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
}, (table) => ({
  userCreatedIdx: index("idx_payment_logs_user").on(table.userId, table.createdAt),
}));

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
  subscriptionType: text("subscription_type").notNull().default("infinite_hearts"),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  paymentId: text("payment_id"),
  amount: text("amount").notNull().default("100"),
  currency: text("currency").notNull().default("TRY"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userStatusIdx: index("idx_subscriptions_user_status").on(table.userId, table.status),
  statusEndDateIdx: index("idx_subscriptions_status_end_date").on(table.status, table.endDate),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
}));

// Activity tracking for analytics
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  eventType: text("event_type").notNull(),
  page: text("page"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_activity_log_user").on(table.userId),
  eventTypeIdx: index("idx_activity_log_event_type").on(table.eventType),
  createdAtIdx: index("idx_activity_log_created_at").on(table.createdAt),
}));

// Daily rollup of activity_log (populated by `cleanup_activity_log()` in the
// daily cron). Survives TTL pruning of raw rows so long-term analytics work.
export const activityLogDaily = pgTable("activity_log_daily", {
  day: timestamp("day", { mode: "date" }).notNull(),
  eventType: text("event_type").notNull(),
  // `page` bileşik primary key’in parçasıdır; Postgres PK sütunlarında NULL’a
  // izin vermez (drizzle push aksi halde DROP NOT NULL’da 42P16 atar).
  page: text("page").notNull().default(""),
  eventCount: integer("event_count").notNull().default(0),
  uniqueUsers: integer("unique_users").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.day, table.eventType, table.page] }),
  dayIdx: index("activity_log_daily_day_idx").on(table.day),
  eventIdx: index("activity_log_daily_event_idx").on(table.eventType, table.day),
}));

// Lightweight Postgres-native error tracking (see migration 0023).
export const errorLog = pgTable("error_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  source: text("source").notNull(),
  location: text("location"),
  level: text("level").notNull().default("error"),
  message: text("message").notNull(),
  stack: text("stack"),
  userId: text("user_id"),
  requestId: text("request_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  userAgent: text("user_agent"),
  url: text("url"),
}, (table) => ({
  createdAtIdx: index("error_log_created_at_idx").on(table.createdAt),
  sourceLevelIdx: index("error_log_source_level_idx").on(table.source, table.level, table.createdAt),
  userIdIdx: index("error_log_user_id_idx").on(table.userId),
}));

// Admin audit trail (see migration 0024). Every privileged admin action
// lands here: role changes, application approvals, course edits, etc.
export const adminAudit = pgTable("admin_audit", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  actorId: text("actor_id").notNull(),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
}, (table) => ({
  createdAtIdx: index("admin_audit_created_at_idx").on(table.createdAt),
  actorCreatedIdx: index("admin_audit_actor_created_idx").on(table.actorId, table.createdAt),
  actionCreatedIdx: index("admin_audit_action_created_idx").on(table.action, table.createdAt),
  targetIdx: index("admin_audit_target_idx").on(table.targetType, table.targetId),
}));
