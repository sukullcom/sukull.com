import { cache } from "react";
import db from "@/db/drizzle";
import { sql, eq, and, or, desc, asc, inArray, count, avg } from "drizzle-orm";
import {
  users,
  lessonReviews,
  lessonBookings,
  teacherFields,
  teacherApplications,
  schools,
  userProgress,
  courses,
  units,
  lessons,
  challenges,
  challengeProgress,
  snippets
} from "@/db/schema";

// ✅ OPTIMIZED: Single query with joins instead of N+1
export const getTeachersWithRatingsOptimized = cache(async () => {
  const result = await db.execute(sql`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.avatar,
      u.description as bio,
      u.meet_link,
      COALESCE(AVG(lr.rating), 0) as avg_rating,
      COUNT(lr.id) as review_count,
      STRING_AGG(DISTINCT tf.display_name, ', ') as fields_new,
      MAX(ta.field) as field_legacy
    FROM users u
    LEFT JOIN lesson_reviews lr ON u.id = lr.teacher_id
    LEFT JOIN teacher_fields tf ON u.id = tf.teacher_id AND tf.is_active = true
    LEFT JOIN teacher_applications ta ON u.id = ta.user_id
    WHERE u.role = 'teacher'
    GROUP BY u.id, u.name, u.email, u.avatar, u.description, u.meet_link
    ORDER BY avg_rating DESC, review_count DESC
  `);

  return result.map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    bio: row.bio,
    meetLink: row.meet_link,
    field: row.fields_new || row.field_legacy || "",
    fields: row.fields_new ? row.fields_new.split(', ') : (row.field_legacy ? [row.field_legacy] : []),
    averageRating: Math.round(Number(row.avg_rating) * 10) / 10,
    totalReviews: Number(row.review_count),
  }));
});

// ✅ BATCH QUERIES: Fetch multiple entities at once
export const batchQueries = {
  async getUsersAndSchools(userIds: string[], schoolIds: number[]) {
    const [users, schools] = await Promise.all([
      db.query.users.findMany({ 
        where: inArray(users.id, userIds),
        columns: { id: true, name: true, avatar: true, email: true }
      }),
      db.query.schools.findMany({ 
        where: inArray(schools.id, schoolIds),
        columns: { id: true, name: true, type: true, city: true, district: true }
      })
    ]);
    return { users, schools };
  },

  async getStudentBookingsWithTeacherData(studentId: string) {
    try {
      // ✅ FIXED: Use the existing getStudentBookings function to avoid SQL compatibility issues
      const { getStudentBookings } = await import("@/db/queries");
      return await getStudentBookings(studentId);
    } catch (error) {
      console.error('Error in getStudentBookingsWithTeacherData:', error);
      
      // ✅ FALLBACK: If import fails, use basic query without complex joins
      try {
        const basicBookings = await db.query.lessonBookings.findMany({
          where: eq(lessonBookings.studentId, studentId),
          orderBy: desc(lessonBookings.startTime),
          with: {
            teacher: {
              columns: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                meetLink: true,
              }
            },
            review: true
          },
        });

        return basicBookings.map(booking => ({
          ...booking,
          teacherId: booking.teacherId,
          studentId: booking.studentId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          field: "Özel Ders", // Default field name
          fields: ["Özel Ders"],
        }));
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
  },

  async getCourseWithUnitsOptimized(courseId: number) {
    // Single query to get course with selective fields instead of over-fetching
    const result = await db.execute(sql`
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.image_src as course_image,
        u.id as unit_id,
        u.title as unit_title,
        u.description as unit_description,
        u.order as unit_order,
        l.id as lesson_id,
        l.title as lesson_title,
        l.order as lesson_order,
        COUNT(ch.id) as challenge_count
      FROM courses c
      LEFT JOIN units u ON c.id = u.course_id
      LEFT JOIN lessons l ON u.id = l.unit_id
      LEFT JOIN challenges ch ON l.id = ch.lesson_id
      WHERE c.id = ${courseId}
      GROUP BY c.id, c.title, c.image_src, u.id, u.title, u.description, u.order,
               l.id, l.title, l.order
      ORDER BY u.order ASC, l.order ASC
    `);

    if (result.length === 0) return null;

    const course = {
      id: result[0].course_id,
      title: result[0].course_title,
      imageSrc: result[0].course_image,
      units: [] as any[]
    };

    const unitsMap = new Map();
    
    result.forEach((row: any) => {
      if (row.unit_id && !unitsMap.has(row.unit_id)) {
        unitsMap.set(row.unit_id, {
          id: row.unit_id,
          title: row.unit_title,
          description: row.unit_description,
          order: row.unit_order,
          lessons: []
        });
      }

      if (row.lesson_id && unitsMap.has(row.unit_id)) {
        const unit = unitsMap.get(row.unit_id);
        const existingLesson = unit.lessons.find((l: any) => l.id === row.lesson_id);
        
        if (!existingLesson) {
          unit.lessons.push({
            id: row.lesson_id,
            title: row.lesson_title,
            order: row.lesson_order,
            challengeCount: Number(row.challenge_count)
          });
        }
      }
    });

    course.units = Array.from(unitsMap.values());
    return course;
  }
};

// ✅ SELECTIVE FIELD QUERIES: Only fetch what you need
export const selectiveQueries = {
  async getUserProgressMinimal(userId: string) {
    const [result] = await db
      .select({
        points: userProgress.points,
        hearts: userProgress.hearts,
        activeCourseId: userProgress.activeCourseId,
        schoolId: userProgress.schoolId,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .limit(1);

    return result || null;
  },

  async getSnippetsWithSearch(params: {
    search?: string;
    language?: string;
    limit?: number;
    offset?: number;
  }) {
    const { search, language, limit = 20, offset = 0 } = params;
    
    let query = sql`
      SELECT 
        s.id,
        s.title,
        s.language,
        s.user_name,
        s.created_at,
        LENGTH(s.code) as code_length
      FROM snippets s
    `;
    
    const conditions = [];
    const queryParams: any[] = [];
    
    if (search?.trim()) {
      conditions.push(`(s.title ILIKE $${queryParams.length + 1} OR s.language ILIKE $${queryParams.length + 1} OR s.user_name ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search.trim()}%`);
    }
    
    if (language?.trim()) {
      conditions.push(`s.language = $${queryParams.length + 1}`);
      queryParams.push(language.trim());
    }
    
    if (conditions.length > 0) {
      query = sql`${query} WHERE ${sql.raw(conditions.join(' AND '))}`;
    }
    
    query = sql`${query} ORDER BY s.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(Math.min(limit, 50), Math.max(offset, 0));
    
    return db.execute(sql`${query}`, queryParams);
  },

  async getSchoolLeaderboardOptimized(type?: string, city?: string, limit = 50) {
    let query = sql`
      SELECT 
        s.id,
        s.name,
        s.city,
        s.district,
        s.type,
        s.total_points,
        COUNT(up.user_id) as student_count
      FROM schools s
      LEFT JOIN user_progress up ON s.id = up.school_id
    `;
    
    const conditions = [];
    const queryParams: any[] = [];
    
    if (type) {
      conditions.push(`s.type = $${queryParams.length + 1}`);
      queryParams.push(type);
    }
    
    if (city) {
      conditions.push(`s.city = $${queryParams.length + 1}`);
      queryParams.push(city.toUpperCase());
    }
    
    if (conditions.length > 0) {
      query = sql`${query} WHERE ${sql.raw(conditions.join(' AND '))}`;
    }
    
    query = sql`${query} GROUP BY s.id, s.name, s.city, s.district, s.type, s.total_points
                ORDER BY s.total_points DESC, s.name ASC 
                LIMIT $${queryParams.length + 1}`;
    queryParams.push(Math.min(limit, 100));
    
    return db.execute(sql`${query}`, queryParams);
  }
};

// ✅ AGGREGATION QUERIES: Use database for calculations
export const aggregationQueries = {
  async getUserStats(userId: string) {
    const [result] = await db.execute(sql`
      SELECT 
        up.points,
        up.hearts,
        COUNT(cp.id) as completed_challenges,
        COUNT(DISTINCT cp.lesson_id) as completed_lessons,
        (
          SELECT COUNT(*) 
          FROM user_progress up2 
          WHERE up2.points > up.points
        ) + 1 as global_rank,
        CASE 
          WHEN up.school_id IS NOT NULL THEN (
            SELECT COUNT(*) 
            FROM user_progress up3 
            WHERE up3.school_id = up.school_id AND up3.points > up.points
          ) + 1
          ELSE NULL
        END as school_rank
      FROM user_progress up
      LEFT JOIN challenge_progress cp ON up.user_id = cp.user_id AND cp.completed = true
      WHERE up.user_id = ${userId}
      GROUP BY up.user_id, up.points, up.hearts, up.school_id
    `);

    return result;
  },

  async getTeacherStatsOptimized(teacherId: string) {
    const [result] = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT lb.id) as total_lessons,
        COUNT(DISTINCT CASE WHEN lb.status = 'completed' THEN lb.id END) as completed_lessons,
        COUNT(DISTINCT lr.id) as total_reviews,
        COALESCE(AVG(lr.rating), 0) as avg_rating,
        SUM(CASE WHEN lb.status = 'completed' THEN 1 ELSE 0 END * 50) as total_income
      FROM lesson_bookings lb
      LEFT JOIN lesson_reviews lr ON lb.id = lr.booking_id
      WHERE lb.teacher_id = ${teacherId}
    `);

    return {
      totalLessons: Number(result.total_lessons),
      completedLessons: Number(result.completed_lessons),
      totalReviews: Number(result.total_reviews),
      averageRating: Math.round(Number(result.avg_rating) * 10) / 10,
      totalIncome: Number(result.total_income),
    };
  }
};

// ✅ CACHING LAYER: Smart caching for frequently accessed data
export class QueryCache {
  private static memoryCache = new Map<string, { data: any; expiry: number }>();
  
  private static readonly TTL = {
    SHORT: 60 * 1000,      // 1 minute
    MEDIUM: 5 * 60 * 1000, // 5 minutes  
    LONG: 30 * 60 * 1000,  // 30 minutes
  };

  static async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = QueryCache.TTL.MEDIUM
  ): Promise<T> {
    const cached = QueryCache.memoryCache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    const data = await fetcher();
    QueryCache.memoryCache.set(key, { 
      data, 
      expiry: Date.now() + ttl 
    });
    
    // Cleanup expired entries periodically
    if (QueryCache.memoryCache.size > 1000) {
      QueryCache.cleanup();
    }
    
    return data;
  }

  static cleanup() {
    const now = Date.now();
    for (const [key, value] of QueryCache.memoryCache.entries()) {
      if (value.expiry <= now) {
        QueryCache.memoryCache.delete(key);
      }
    }
  }

  static clear() {
    QueryCache.memoryCache.clear();
  }

  static invalidate(keyPattern: string) {
    for (const key of QueryCache.memoryCache.keys()) {
      if (key.includes(keyPattern)) {
        QueryCache.memoryCache.delete(key);
      }
    }
  }
}

// ✅ CACHED OPTIMIZED QUERIES
export const cachedQueries = {
  getTeachersWithRatings: () => 
    QueryCache.getOrSet(
      'teachers_with_ratings', 
      getTeachersWithRatingsOptimized, 
      QueryCache.TTL.MEDIUM
    ),

  getUserStats: (userId: string) =>
    QueryCache.getOrSet(
      `user_stats_${userId}`,
      () => aggregationQueries.getUserStats(userId),
      QueryCache.TTL.SHORT
    ),

  getSchoolLeaderboard: (type?: string, city?: string) =>
    QueryCache.getOrSet(
      `school_leaderboard_${type || 'all'}_${city || 'all'}`,
      () => selectiveQueries.getSchoolLeaderboardOptimized(type, city),
      QueryCache.TTL.LONG
    ),
}; 