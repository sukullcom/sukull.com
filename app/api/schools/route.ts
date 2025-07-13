import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/drizzle';
import { schools } from '@/db/schema';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';

type SchoolType = 'university' | 'high_school' | 'secondary_school' | 'elementary_school';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || searchParams.get('step'); // Support both 'action' and 'step' for backward compatibility
    const city = searchParams.get('city');
    const district = searchParams.get('district');
    const category = searchParams.get('category');
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '1000');

    switch (action) {
      case 'cities': {
        // Get all cities with school counts
        const cities = await db
          .select({
            city: schools.city,
            count: sql<number>`count(*)::int`
          })
          .from(schools)
          .groupBy(schools.city)
          .orderBy(schools.city);

        return NextResponse.json({ cities });
      }

      case 'districts': {
        // Get districts for selected city
        if (!city) {
          return NextResponse.json({ error: 'City is required' }, { status: 400 });
        }

        const districts = await db
          .select({
            district: schools.district,
            count: sql<number>`count(*)::int`
          })
          .from(schools)
          .where(eq(schools.city, city.toUpperCase()))
          .groupBy(schools.district)
          .orderBy(schools.district);

        return NextResponse.json({ districts });
      }

      case 'categories': {
        // Get categories for selected city and district
        if (!city || !district) {
          return NextResponse.json({ error: 'City and district are required' }, { status: 400 });
        }

        const categories = await db
          .select({
            category: schools.category,
            type: schools.type,
            count: sql<number>`count(*)::int`
          })
          .from(schools)
          .where(and(
            eq(schools.city, city.toUpperCase()),
            eq(schools.district, district.toUpperCase())
          ))
          .groupBy(schools.category, schools.type)
          .orderBy(schools.category);

        return NextResponse.json({ categories });
      }

      case 'schools':
      case 'search': {
        // Get schools for selected filters (supports both filtered and search functionality)
        if (!city || !district || !category) {
          return NextResponse.json({ 
            error: 'City, district, and category are required' 
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
          .limit(Math.min(limit, 1000));

        return NextResponse.json({ schools: schoolResults });
      }

      case 'leaderboard': {
        // Get school leaderboard
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
          .limit(Math.min(limit, 50));

        return NextResponse.json({ schools: leaderboardResults });
      }

      default:
        return NextResponse.json({ error: 'Invalid action parameter. Use: cities, districts, categories, schools, search, or leaderboard' }, { status: 400 });
    }
  } catch (error) {
    console.error('Schools API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle POST for comprehensive leaderboard (all school types)
export async function POST(request: NextRequest) {
  try {
    const { city, limit = 10 } = await request.json();

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
        .limit(Math.min(limit, 50));

      leaderboards[schoolType] = results;
    }

    return NextResponse.json({ leaderboards });
  } catch (error) {
    console.error('All leaderboards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 