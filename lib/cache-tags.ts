/**
 * Centralized Next.js data-cache tag registry.
 *
 * `unstable_cache` keys are salted automatically by Next; tags are how we
 * invalidate. Keeping them here (instead of inline string literals) prevents
 * typos that would silently cause stale data.
 *
 * Usage:
 *   • Read path: `unstable_cache(fn, [stable-key], { tags: [CACHE_TAGS.courses] })`
 *   • Write path: after an admin mutation, `revalidateTag(CACHE_TAGS.courses)`
 *
 * Most top-level values are **string literals** so Next's build step can
 * statically track them. A few are **tag factories** (functions) for
 * per-entity caches (e.g. per-teacher stats); those produce deterministic
 * string tags at runtime and work the same way with `revalidateTag`.
 */
export const CACHE_TAGS = {
  /** All `courses` rows + child units/lessons graph when fetched by id. */
  courses: "courses",
  /** Top-N leaderboard (user_progress sorted by points). */
  leaderboard: "leaderboard",
  /** Teacher listing with ratings + fields. */
  teachers: "teachers",
  /** Schools master data: cities, districts, categories aggregations. */
  schoolsMaster: "schools-master",
  /** Public school listing (search-backed). */
  schools: "schools",
  /**
   * Per-teacher aggregated stats (total lessons, reviews, income).
   * Passed as a tag factory so the same call at the read and write sides
   * always produces the same string: `teacher-stats:{userId}`.
   */
  teacherStats: (teacherId: string) => `teacher-stats:${teacherId}`,
} as const;

/**
 * Union of all cache tag values — both literal strings and factory outputs.
 * Used to keep `revalidateTag` call sites type-safe.
 */
export type CacheTag =
  | (typeof CACHE_TAGS)["courses"]
  | (typeof CACHE_TAGS)["leaderboard"]
  | (typeof CACHE_TAGS)["teachers"]
  | (typeof CACHE_TAGS)["schoolsMaster"]
  | (typeof CACHE_TAGS)["schools"]
  | ReturnType<(typeof CACHE_TAGS)["teacherStats"]>;

/**
 * Default TTLs in seconds. These are upper bounds — a `revalidateTag()` call
 * from a mutation will invalidate immediately regardless of TTL.
 *
 * Choose TTL to match "how stale can this be if the cache never invalidates?"
 * NOT "how often does the data change?". Invalidation handles freshness.
 */
export const CACHE_TTL = {
  /** Courses change only via admin course-builder. 6h is safe. */
  courses: 60 * 60 * 6,
  /** Leaderboard: best served briefly cached to avoid full-table sorts. */
  leaderboard: 60 * 2,
  /** Teachers: ratings update on reviews; 5 min is tolerable. */
  teachers: 60 * 5,
  /** Schools master data: loaded once per import. 24h. */
  schoolsMaster: 60 * 60 * 24,
  /** Schools listing: minor changes between imports. 1h. */
  schools: 60 * 60,
  /**
   * Per-teacher stats: a dashboard query that fans out to two joined
   * tables. 60s is short enough that any missed invalidation self-heals
   * within a page refresh, long enough to absorb refresh-spamming.
   */
  teacherStats: 60,
} as const;
