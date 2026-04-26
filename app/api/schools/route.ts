import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import db from '@/db/drizzle';
import { schools } from '@/db/schema';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import { CACHE_TAGS, CACHE_TTL } from '@/lib/cache-tags';
import { secureApi } from '@/lib/api-middleware';
import { RATE_LIMITS } from '@/lib/rate-limit-db';
import { getRequestLogger } from '@/lib/logger';
import { clampPositiveInt } from '@/lib/pagination';

type SchoolType = 'university' | 'high_school' | 'secondary_school' | 'elementary_school';

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

/**
 * Public read endpoint — IP-scoped limit. The `unstable_cache` layer above
 * absorbs the happy path; this limiter protects against adversarial query
 * combinations (unique city/district/search permutations) that bypass the
 * cache keyspace and trigger fresh `LIKE %..%` scans.
 */
export const GET = secureApi.rateLimited(
  { bucket: 'schools-get', keyKind: 'ip', ...RATE_LIMITS.schoolsRead },
  async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || searchParams.get('step'); // Support both 'action' and 'step' for backward compatibility
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
        return NextResponse.json({ cities });
      }

      case 'districts': {
        if (!city) {
          return NextResponse.json({ error: 'İl bilgisi gereklidir.' }, { status: 400 });
        }
        const districts = await getDistrictsAggregate(city.toUpperCase());
        return NextResponse.json({ districts });
      }

      case 'categories': {
        if (!city || !district) {
          return NextResponse.json({ error: 'İl ve ilçe bilgisi gereklidir.' }, { status: 400 });
        }
        const categories = await getCategoriesAggregate(
          city.toUpperCase(),
          district.toUpperCase(),
        );
        return NextResponse.json({ categories });
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

        return NextResponse.json({ schools: schoolResults });
      }

      case 'leaderboard': {
        const offset = clampPositiveInt(searchParams.get('offset'), 0, 100_000);
        // Re-clamp to leaderboard's tighter ceiling (100) since the outer
        // scope clamps to 1000 for search/schools calls.
        const lbLimit = Math.min(limit, 100);
        const leaderboardConditions = [];

        if (type) {
          leaderboardConditions.push(eq(schools.type, type as SchoolType));
        }

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
          .where(leaderboardConditions.length > 0 ? and(...leaderboardConditions) : undefined)
          .orderBy(desc(schools.totalPoints), schools.name)
          .limit(lbLimit)
          .offset(offset);

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
  },
);

// Handle POST for comprehensive leaderboard (all school types)
export const POST = secureApi.rateLimited(
  { bucket: 'schools-post', keyKind: 'ip', ...RATE_LIMITS.schoolsRead },
  async (request: NextRequest) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      city?: unknown;
      limit?: unknown;
    };
    const city = typeof body.city === "string" ? body.city : null;
    // Clamp `limit` defensively: JSON payloads from untrusted clients can
    // send `null`, strings, or omit the field, any of which would make
    // `Math.min(limit, 50)` return NaN → Drizzle then emits `LIMIT NaN`
    // which Postgres rejects at query time. Coerce to a finite integer
    // in [1, 50] before use.
    const limit = clampPositiveInt(body.limit, 10, 50);

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
  },
);
