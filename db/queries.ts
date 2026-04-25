/**
 * Back-compat facade for `@/db/queries`.
 *
 * The actual implementation lives in `db/queries/<domain>.ts`. This file
 * exists so existing call sites that import from `@/db/queries` keep
 * working without a codemod. New code SHOULD import from the domain
 * files directly (e.g. `@/db/queries/user`, `@/db/queries/listings`) —
 * it documents intent and reduces accidental cross-domain coupling.
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
// Applications: teacher onboarding, role checks, teacher fields
// ---------------------------------------------------------------------------
export type {
  ApplicationStatus,
  ApplicationStatusFilter,
  AdminPaginationInput,
  AdminPaginatedResult,
  SaveTeacherApplicationInput,
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
} from "./queries/applications";

// ---------------------------------------------------------------------------
// Teacher directory (public rehber + profile page)
// ---------------------------------------------------------------------------
export { getTeachersDirectory, getTeacherProfile } from "./queries/teacher";
export type { TeacherDirectoryRow } from "./queries/teacher";

// ---------------------------------------------------------------------------
// Marketplace: listings + offers + message unlocks
// ---------------------------------------------------------------------------
export {
  getOpenListings,
  getListingById,
  getListingWithOffers,
  getMyListings,
  createListing,
  closeListing,
  getListingsOfferCount,
} from "./queries/listings";
export type { ListingRow, ListingWithOffersRow } from "./queries/listings";

export {
  getOffersForListing,
  getMyOffers,
  hasTeacherOfferedOnListing,
  createOffer,
  withdrawOffer,
  acceptOffer,
  rejectOffer,
  MAX_OFFERS_PER_LISTING,
} from "./queries/offers";
export type { OfferRow } from "./queries/offers";

export {
  getMessageUnlock,
  unlockMessageThread,
  listStudentConversations,
  listTeacherConversations,
} from "./queries/messages";

// ---------------------------------------------------------------------------
// Snippets: code-editor snippets
// ---------------------------------------------------------------------------
export {
  createSnippet,
  getUserSnippetCount,
  getSnippetById,
  getAllSnippets,
} from "./queries/snippets";
