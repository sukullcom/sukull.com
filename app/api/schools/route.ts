import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import db from '@/db/drizzle';
import { schools } from '@/db/schema';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import { CACHE_TAGS, CACHE_TTL } from '@/lib/cache-tags';
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/rate-limit-db';
import { getRequestLogger } from '@/lib/logger';
import { clampPositiveInt } from '@/lib/pagination';
import { SCHOOL_LEADERBOARD_LIST_MAX } from '@/lib/school-leaderboard-limits';
import { sortSchoolCategories } from '@/lib/school-catalog';

type SchoolType = 'university' | 'high_school' | 'secondary_school' | 'elementary_school';

/** Tarayıcı önbelleği: aggregate veri nadiren değişir (Next `unstable_cache` + tag ile tutarlı). */
const SCHOOL_MASTER_AGG_CACHE_CONTROL =
  'public, max-age=600, stale-while-revalidate=86400';

function jsonSchoolCatalog<T extends Record<string, unknown>>(body: T): NextResponse {
  const res = NextResponse.json(body);
  res.headers.set('Cache-Control', SCHOOL_MASTER_AGG_CACHE_CONTROL);
  return res;
}

/**
 * Schools master-data aggregations.
 *
 * Cities/districts/categories change only when the admin re-imports the
 * master school list (rare; at most monthly). Caching these for 24h
 * collapses thousands of daily GROUP BY scans into ~1 query per day.
 *
 * Invalidated by `revalidateTag(CACHE_TAGS.schoolsMaster)` after the
 * import script completes.
 */
const getCitiesAggregate = unstable_cache(
  async () =>
    db
      .select({
        city: schools.city,
        count: sql<number>`count(*)::int`,
      })
      .from(schools)
      .groupBy(schools.city)
      .orderBy(schools.city),
  ['schools-cities'],
  { tags: [CACHE_TAGS.schoolsMaster], revalidate: CACHE_TTL.schoolsMaster },
);

const getDistrictsAggregate = unstable_cache(
  async (cityUpper: string) =>
    db
      .select({
        district: schools.district,
        count: sql<number>`count(*)::int`,
      })
      .from(schools)
      .where(eq(schools.city, cityUpper))
      .groupBy(schools.district)
      .orderBy(schools.district),
  ['schools-districts'],
  { tags: [CACHE_TAGS.schoolsMaster], revalidate: CACHE_TTL.schoolsMaster },
);

const getCategoriesAggregate = unstable_cache(
  async (cityUpper: string, districtUpper: string) =>
    db
      .select({
        category: schools.category,
        type: schools.type,
        count: sql<number>`count(*)::int`,
      })
      .from(schools)
      .where(and(eq(schools.city, cityUpper), eq(schools.district, districtUpper)))
      .groupBy(schools.category, schools.type)
      .orderBy(schools.category),
  ['schools-categories'],
  { tags: [CACHE_TAGS.schoolsMaster], revalidate: CACHE_TTL.schoolsMaster },
);

function rateLimitSchoolsGet(ip: string, action: string | null) {
  const catalogOnly =
    action === 'cities' || action === 'districts' || action === 'categories';
  if (catalogOnly) {
    return checkRateLimit({
      key: `schools-catalog:ip:${ip}`,
      ...RATE_LIMITS.schoolsCatalogRead,
    });
  }
  return checkRateLimit({
    key: `schools-get:ip:${ip}`,
    ...RATE_LIMITS.schoolsRead,
  });
}

/**
 * Public read endpoint — IP-scoped limits.
 * Catalog aggregates (city/district/type) use a separate generous bucket so
 * many users behind one NAT (school Wi‑Fi) can complete onboarding without
 * exhausting the tighter bucket used for school lists / leaderboard queries.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || searchParams.get('step');
    const rl = await rateLimitSchoolsGet(getClientIp(request), action);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen biraz bekleyin.' },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const city = searchParams.get('city');
    const district = searchParams.get('district');
    const category = searchParams.get('category');
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type');
    // Defensive clamp: non-numeric / negative / overflow inputs collapse
    // to the catalogue's public ceiling (1000). Previously a bare
    // `parseInt` on a missing or garbage value produced NaN which then
    // flowed into Drizzle's `.limit(NaN)` and surfaced as opaque
    // Postgres errors under MAU-10K traffic patterns.
    const limit = clampPositiveInt(searchParams.get('limit'), 1000, 1000);

    switch (action) {
      case 'cities': {
        const cities = await getCitiesAggregate();
        return jsonSchoolCatalog({ cities });
      }

      case 'districts': {
        if (!city) {
          return NextResponse.json({ error: 'İl bilgisi gereklidir.' }, { status: 400 });
        }
        const districts = await getDistrictsAggregate(city.toUpperCase());
        return jsonSchoolCatalog({ districts });
      }

      case 'categories': {
        if (!city || !district) {
          return NextResponse.json({ error: 'İl ve ilçe bilgisi gereklidir.' }, { status: 400 });
        }
        const categories = sortSchoolCategories(
          await getCategoriesAggregate(city.toUpperCase(), district.toUpperCase()),
        );
        return jsonSchoolCatalog({ categories });
      }

      case 'schools':
      case 'search': {
        // Get schools for selected filters (supports both filtered and search functionality)
        if (!city || !district || !category) {
          return NextResponse.json({ 
            error: 'İl, ilçe ve kategori bilgisi gereklidir.' 
          }, { status: 400 });
        }

        const whereConditions = [
          eq(schools.city, city.toUpperCase()),
          eq(schools.district, district.toUpperCase()),
          eq(schools.category, category)
        ];

        // Add name search if query provided
        if (query && query.length >= 1) {
          whereConditions.push(ilike(schools.name, `%${query}%`));
        }

        const schoolResults = await db
          .select({
            id: schools.id,
            name: schools.name,
            city: schools.city,
            district: schools.district,
            category: schools.category,
            kind: schools.kind,
            type: schools.type,
            totalPoints: schools.totalPoints,
          })
          .from(schools)
          .where(and(...whereConditions))
          .orderBy(
            query ? sql`
              CASE 
                WHEN LOWER(${schools.name}) = LOWER(${query}) THEN 1
                WHEN LOWER(${schools.name}) LIKE LOWER(${query}||'%') THEN 2
                ELSE 3
              END,
              ${schools.totalPoints} DESC,
              ${schools.name} ASC
            ` : sql`${schools.name} ASC`
          )
          .limit(limit);

        const res = NextResponse.json({ schools: schoolResults });
        res.headers.set(
          'Cache-Control',
          'public, max-age=120, stale-while-revalidate=3600',
        );
        return res;
      }

      case 'leaderboard': {
        if (
          !type ||
          !['university', 'high_school', 'secondary_school', 'elementary_school'].includes(
            type,
          )
        ) {
          return NextResponse.json(
            { error: 'Okul tipi (type) gereklidir.' },
            { status: 400 },
          );
        }
        const lbLimit = clampPositiveInt(
          searchParams.get('limit'),
          SCHOOL_LEADERBOARD_LIST_MAX,
          SCHOOL_LEADERBOARD_LIST_MAX,
        );
        const leaderboardConditions = [eq(schools.type, type as SchoolType)];

        if (city) {
          leaderboardConditions.push(eq(schools.city, city.toUpperCase()));
        }

        const leaderboardResults = await db
          .select({
            id: schools.id,
            name: schools.name,
            city: schools.city,
            district: schools.district,
            category: schools.category,
            kind: schools.kind,
            type: schools.type,
            totalPoints: schools.totalPoints,
          })
          .from(schools)
          .where(and(...leaderboardConditions))
          .orderBy(desc(schools.totalPoints), schools.name)
          .limit(lbLimit)
          .offset(0);

        return NextResponse.json({ schools: leaderboardResults });
      }

      default:
        return NextResponse.json({ error: 'Geçersiz istek parametresi.' }, { status: 400 });
    }
  } catch (error) {
    {
      const log = await getRequestLogger({ labels: { route: 'api/schools', op: 'search' } });
      log.error({ message: 'schools search failed', error, location: 'api/schools' });
    }
    return NextResponse.json({ error: 'Sunucu tarafında bir hata oluştu.' }, { status: 500 });
  }
}

// Handle POST for comprehensive leaderboard (all school types)
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit({
      key: `schools-bulk:ip:${ip}`,
      ...RATE_LIMITS.schoolsBulkPost,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen biraz bekleyin.' },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      city?: unknown;
      limit?: unknown;
    };
    const city = typeof body.city === "string" ? body.city : null;
    // Coerce to a finite integer in [1, SCHOOL_LEADERBOARD_LIST_MAX] before use.
    const limit = clampPositiveInt(body.limit, 10, SCHOOL_LEADERBOARD_LIST_MAX);

    const leaderboards: Record<SchoolType, unknown[]> = {
      university: [],
      high_school: [],
      secondary_school: [],
      elementary_school: []
    };

    const schoolTypes: SchoolType[] = ['university', 'high_school', 'secondary_school', 'elementary_school'];

    for (const schoolType of schoolTypes) {
      const whereConditions = [eq(schools.type, schoolType)];

      if (city) {
        whereConditions.push(eq(schools.city, city.toUpperCase()));
      }

      const results = await db
        .select({
          id: schools.id,
          name: schools.name,
          city: schools.city,
          district: schools.district,
          category: schools.category,
          kind: schools.kind,
          type: schools.type,
          totalPoints: schools.totalPoints,
        })
        .from(schools)
        .where(and(...whereConditions))
        .orderBy(desc(schools.totalPoints), schools.name)
        .limit(limit);

      leaderboards[schoolType] = results;
    }

    return NextResponse.json({ leaderboards });
  } catch (error) {
    {
      const log = await getRequestLogger({ labels: { route: 'api/schools', op: 'leaderboards' } });
      log.error({ message: 'all leaderboards failed', error, location: 'api/schools/leaderboards' });
    }
    return NextResponse.json({ error: 'Sunucu tarafında bir hata oluştu.' }, { status: 500 });
  }
}
