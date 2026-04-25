/**
 * Leaderboard queries: top users, school rankings, and the user's own rank.
 *
 * `getTopUsers` is wrapped in `unstable_cache` with a short TTL so that
 * /leaderboard renders from the data cache instead of hitting Postgres on
 * every view. Mutations that change `user_progress.points` do NOT bust
 * this cache on purpose — the TTL bounds staleness to a couple of minutes
 * and we'd otherwise flush on every lesson completion.
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import { schools, userProgress } from "@/db/schema";
import { getServerUser } from "@/lib/auth";
import { normalizeAvatarUrl } from "@/utils/avatar";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache-tags";
import { queryResultRows } from "@/lib/query-result";

export const getTopTenUsers = cache(async () => {
  const user = await getServerUser();
  if (!user) {
    return [];
  }

  return getTopUsers(10, 0);
});

/**
 * Top-N leaderboard. Every authenticated user hitting /leaderboard would
 * otherwise trigger an ORDER BY on `user_progress`. Caching the top page
 * for 2 minutes collapses that to ~30 scans/hour globally.
 *
 * Cached per (limit, offset). Invalidated when points change via
 * `revalidateTag(CACHE_TAGS.leaderboard)` — we do NOT call this on every
 * point mutation (that would defeat the cache); instead the TTL bounds
 * staleness to 2 minutes.
 */
const _getTopUsersCached = unstable_cache(
  async (limit: number, offset: number) => {
    return db.query.userProgress.findMany({
      orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
      limit,
      offset,
      columns: {
        userId: true,
        userName: true,
        userImageSrc: true,
        points: true,
      },
    });
  },
  ["top-users"],
  { tags: [CACHE_TAGS.leaderboard], revalidate: CACHE_TTL.leaderboard },
);

export const getTopUsers = cache(
  async (limit: number = 50, offset: number = 0) => {
    const data = await _getTopUsersCached(limit, offset);
    return data.map((user) => ({
      ...user,
      userImageSrc: normalizeAvatarUrl(user.userImageSrc),
    }));
  },
);

export const getSchoolPointsByType = cache(
  async (
    schoolType:
      | "university"
      | "high_school"
      | "secondary_school"
      | "elementary_school",
    limit: number = 50,
    offset: number = 0,
    city?: string,
  ) => {
    const conditions = [eq(schools.type, schoolType)];
    if (city) {
      conditions.push(eq(schools.city, city.toUpperCase()));
    }

    const topSchools = await db
      .select({
        schoolId: schools.id,
        schoolName: schools.name,
        totalPoints: schools.totalPoints,
        city: schools.city,
      })
      .from(schools)
      .where(and(...conditions))
      .orderBy(desc(schools.totalPoints), asc(schools.name))
      .limit(limit)
      .offset(offset);

    return topSchools;
  },
);

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

  const userProgressData = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { points: true, schoolId: true },
  });

  if (!userProgressData) {
    return null;
  }

  const { points, schoolId } = userProgressData;

  const userRankResult = await db.execute(sql`
    SELECT COUNT(*) + 1 as rank
    FROM user_progress
    WHERE points > ${points}
  `);

  const userRank =
    Number(queryResultRows<{ rank: unknown }>(userRankResult)[0]?.rank) || 1;

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

  const userRankInSchoolResult = await db.execute(sql`
    SELECT COUNT(*) + 1 as rank
    FROM user_progress
    WHERE school_id = ${schoolId} AND points > ${points}
  `);

  const userRankInSchool =
    Number(
      queryResultRows<{ rank: unknown }>(userRankInSchoolResult)[0]?.rank,
    ) || 1;

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

  const schoolRankResult = await db.execute(sql`
    SELECT COUNT(*) + 1 as rank
    FROM schools
    WHERE type = ${schoolType} AND total_points > (
      SELECT total_points FROM schools WHERE id = ${schoolId}
    )
  `);

  const schoolRank =
    Number(
      queryResultRows<{ rank: unknown }>(schoolRankResult)[0]?.rank,
    ) || 1;

  const currentSchoolData = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
    columns: { totalPoints: true },
  });

  return {
    userRank,
    userRankInSchool,
    schoolRank,
    userPoints: points,
    schoolId,
    schoolPoints: currentSchoolData?.totalPoints || 0,
    schoolType,
  };
});
