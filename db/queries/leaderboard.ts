/**
 * Leaderboard queries: top users, school rankings, and the user's own rank.
 *
 * `getTopUsers`, `getSchoolPointsByType`, and per-user rank summaries use
 * `unstable_cache` with short TTLs so hot pages (e.g. /leaderboard) do not
 * hammer Postgres on every navigation. Point mutations intentionally do not
 * bust these tags on every completion — TTL bounds staleness; optional
 * `revalidateTag(CACHE_TAGS.userRank(userId))` exists for stricter freshness.
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
import { SCHOOL_LEADERBOARD_LIST_MAX } from "@/lib/school-leaderboard-limits";
import { schoolHasStudentWithPoints } from "@/lib/school-leaderboard-eligibility";

/**
 * Leaderboard city filter list. Caching for 24h as school data is static.
 */
const _getSchoolCitiesCached = unstable_cache(
  async () => {
    const data = await db
      .selectDistinct({ city: schools.city })
      .from(schools)
      .orderBy(sql`${schools.city} ASC`);
    return data.map((c) => c.city);
  },
  ["school-cities"],
  { tags: [CACHE_TAGS.schoolsMaster], revalidate: CACHE_TTL.schoolsMaster },
);

export const getSchoolCities = cache(async () => {
  return _getSchoolCitiesCached();
});

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

type SchoolLeaderboardType =
  | "university"
  | "high_school"
  | "secondary_school"
  | "elementary_school";

const _getSchoolPointsByTypeCached = unstable_cache(
  async (
    schoolType: SchoolLeaderboardType,
    limit: number,
    offset: number,
    city?: string,
  ) => {
    // Listeye girmek: okulda puanı > 0 en az bir öğrenci. Sıralama: bayes
    // skor → tie-break aktif öğrenci → ad.
    const conditions = [eq(schools.type, schoolType), schoolHasStudentWithPoints()];
    if (city) {
      conditions.push(eq(schools.city, city.toUpperCase()));
    }

    return db
      .select({
        schoolId: schools.id,
        schoolName: schools.name,
        totalPoints: schools.totalPoints,
        topAvgScore: schools.topAvgScore,
        rawAvgPoints: schools.rawAvgPoints,
        activeStudentCount: schools.activeStudentCount,
        city: schools.city,
      })
      .from(schools)
      .where(and(...conditions))
      .orderBy(
        desc(schools.topAvgScore),
        desc(schools.activeStudentCount),
        asc(schools.name),
      )
      .limit(limit)
      .offset(offset);
  },
  ["school-points-by-type-v3-points-eligibility"],
  {
    tags: [CACHE_TAGS.schoolLeaderboard],
    revalidate: CACHE_TTL.schoolLeaderboard,
  },
);

export const getSchoolPointsByType = cache(
  async (
    schoolType: SchoolLeaderboardType,
    limit: number = SCHOOL_LEADERBOARD_LIST_MAX,
    offset: number = 0,
    city?: string,
  ) => {
    const rows = await _getSchoolPointsByTypeCached(
      schoolType,
      limit,
      offset,
      city,
    );
    // `numeric` Postgres tipleri Drizzle'da string döner; client tarafı
    // gerçek sayı bekliyor (toLocaleString, sıralama vs.). Boundary'de
    // bir kez çevirip tüm UI'da güvenli kullanım sağlıyoruz.
    return rows.map((r) => ({
      ...r,
      topAvgScore: Number(r.topAvgScore ?? 0),
      rawAvgPoints: Number(r.rawAvgPoints ?? 0),
    }));
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

async function computeUserRankForUser(userId: string) {
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

  // Okul sıralaması Bayesian skora göre; listede sayılan okullar = puanlı
  // öğrencisi olanlar (aktif-30-gün şartı yok).
  const schoolRankResult = await db.execute(sql`
    SELECT COUNT(*) + 1 AS rank
    FROM schools target_self
    JOIN schools other
      ON other.type = target_self.type
     AND EXISTS (
       SELECT 1 FROM user_progress up_o
       WHERE up_o.school_id = other.id AND up_o.points > 0
     )
     AND (
       other.top_avg_score > target_self.top_avg_score
       OR (
         other.top_avg_score = target_self.top_avg_score
         AND other.active_student_count > target_self.active_student_count
       )
     )
    WHERE target_self.id = ${schoolId}
      AND EXISTS (
        SELECT 1 FROM user_progress up_t
        WHERE up_t.school_id = target_self.id AND up_t.points > 0
      )
  `);

  const schoolRankRow = queryResultRows<{ rank: unknown }>(schoolRankResult)[0];
  const schoolRank = schoolRankRow ? Number(schoolRankRow.rank) || 1 : null;

  const currentSchoolData = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
    columns: {
      totalPoints: true,
      topAvgScore: true,
      rawAvgPoints: true,
      activeStudentCount: true,
    },
  });

  return {
    userRank,
    userRankInSchool,
    schoolRank,
    userPoints: points,
    schoolId,
    schoolPoints: currentSchoolData?.totalPoints || 0,
    schoolBayesScore: Number(currentSchoolData?.topAvgScore ?? 0),
    schoolRawAvg: Number(currentSchoolData?.rawAvgPoints ?? 0),
    schoolActiveStudents: currentSchoolData?.activeStudentCount ?? 0,
    schoolType,
  };
}

function getCachedUserRank(userId: string) {
  return unstable_cache(
    async () => computeUserRankForUser(userId),
    ["user-rank", userId],
    {
      tags: [CACHE_TAGS.userRank(userId)],
      revalidate: CACHE_TTL.userRank,
    },
  )();
}

export const getUserRank = cache(async () => {
  const user = await getServerUser();
  if (!user) {
    return null;
  }
  return getCachedUserRank(user.id);
});
