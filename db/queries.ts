/**
 * Back-compat facade for `@/db/queries`.
 *
 * The actual implementation lives in `db/queries/<domain>.ts`. This file
 * exists so 100+ call sites that import from `@/db/queries` keep working
 * without a codemod. New code SHOULD import from the domain files directly
 * (e.g. `@/db/queries/user`, `@/db/queries/private-lesson`) — it documents
 * intent and reduces accidental cross-domain coupling.
 *
 * If you're here to add a new query:
 *   1. Put it in the right domain file under `db/queries/`.
 *   2. Add a matching `export` line in this file so existing callers can
 *      still reach it via `@/db/queries`.
 *   3. Prefer the new path for any new callers you touch.
 */

// ---------------------------------------------------------------------------
// Cross-domain helpers
// ---------------------------------------------------------------------------
export { getWeekStartDate, getWeekEndDate } from "./queries/shared";

// ---------------------------------------------------------------------------
// User: profile, hearts, credits, subscriptions
// ---------------------------------------------------------------------------
export {
  getUserProgress,
  getUserCredits,
  useCredit,
  refundCredit,
  getUserCreditTransactions,
  hasAvailableCredits,
  checkSubscriptionStatus,
  getUserSubscription,
  createSubscription,
  getUserSubscriptionHistory,
} from "./queries/user";

// ---------------------------------------------------------------------------
// Learn: courses, units, lessons, progress
// ---------------------------------------------------------------------------
export {
  getUnits,
  getCourses,
  getCourseById,
  getCourseProgress,
  getLesson,
  getLessonPercentage,
} from "./queries/learn";

// ---------------------------------------------------------------------------
// Leaderboard: rankings + school points
// ---------------------------------------------------------------------------
export {
  getTopTenUsers,
  getTopUsers,
  getSchoolPointsByType,
  getUniversityPoints,
  getHighSchoolPoints,
  getSecondarySchoolPoints,
  getElementarySchoolPoints,
  getUserRank,
} from "./queries/leaderboard";

// ---------------------------------------------------------------------------
// Schools: master-data listing
// ---------------------------------------------------------------------------
export { getSchools } from "./queries/schools";

// ---------------------------------------------------------------------------
// Applications: teacher + student onboarding, role checks, teacher fields
// ---------------------------------------------------------------------------
export type {
  ApplicationStatus,
  ApplicationStatusFilter,
  AdminPaginationInput,
  AdminPaginatedResult,
} from "./queries/applications";
export {
  saveTeacherApplication,
  getAllTeacherApplications,
  getTeacherApplicationsPaginated,
  getTeacherApplicationById,
  getTeacherApplicationByUserId,
  approveTeacherApplication,
  approveTeacherApplicationWithFields,
  rejectTeacherApplication,
  getTeacherFields,
  updateTeacherFields,
  getAvailableFieldOptions,
  isTeacher,
  isApprovedStudent,
  saveStudentApplication,
  getAllStudentApplications,
  getStudentApplicationsPaginated,
  approveStudentApplication,
  rejectStudentApplication,
} from "./queries/applications";

// ---------------------------------------------------------------------------
// Teacher: availability, profile, ratings, stats, income
// ---------------------------------------------------------------------------
export {
  getTeacherAvailability,
  upsertTeacherAvailability,
  getCurrentTeacherAvailability,
  getTeacherAvailabilityForCurrentWeek,
  getAvailableTeachers,
  getTeacherDetails,
  getTeacherIncome,
  getTeacherReviews,
  getTeachersWithRatingsOptimized,
  getTeacherStats,
  getTeachersWithRatings,
} from "./queries/teacher";

// ---------------------------------------------------------------------------
// Private lesson: booking flow + review submission
// ---------------------------------------------------------------------------
export {
  bookLesson,
  getStudentBookings,
  getTeacherBookings,
  updateBookingStatus,
  submitLessonReview,
} from "./queries/private-lesson";

// ---------------------------------------------------------------------------
// Snippets: code-editor snippets
// ---------------------------------------------------------------------------
export {
  createSnippet,
  getUserSnippetCount,
  getSnippetById,
  getAllSnippets,
} from "./queries/snippets";
