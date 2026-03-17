import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { isApprovedStudent, getTeacherFields } from "@/db/queries";
import { NextRequest } from "next/server";
import db from "@/db/drizzle";
import { users, lessonReviews, teacherApplications } from "@/db/schema";
import { eq, avg, count } from "drizzle-orm";

export const GET = secureApi.auth(async (_request: NextRequest, user) => {
  try {
    const approved = await isApprovedStudent(user.id);
    if (!approved) {
      return ApiResponses.forbidden("Öğretmenleri görüntülemek için onaylı öğrenci olmanız gerekiyor");
    }

    const teacherList = await db.query.users.findMany({
      where: eq(users.role, "teacher"),
      columns: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        description: true,
      },
    });

    const teachersWithRatings = await Promise.all(
      teacherList.map(async (teacher) => {
        const [reviewStats, fields, application] = await Promise.all([
          db.select({
            avgRating: avg(lessonReviews.rating),
            reviewCount: count(lessonReviews.id),
          })
          .from(lessonReviews)
          .where(eq(lessonReviews.teacherId, teacher.id)),

          getTeacherFields(teacher.id),

          db.query.teacherApplications.findFirst({
            where: eq(teacherApplications.userId, teacher.id),
            columns: { field: true },
          }),
        ]);

        const fieldNames = fields?.length > 0
          ? fields.map(f => f.displayName)
          : application?.field ? [application.field] : [];

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          avatar: teacher.avatar,
          bio: teacher.description,
          field: fieldNames.join(", "),
          fields: fieldNames,
          averageRating: reviewStats[0]?.avgRating
            ? Math.round(Number(reviewStats[0].avgRating) * 10) / 10
            : 0,
          totalReviews: Number(reviewStats[0]?.reviewCount ?? 0),
        };
      })
    );

    teachersWithRatings.sort((a, b) => b.averageRating - a.averageRating || b.totalReviews - a.totalReviews);

    return ApiResponses.success({ teachers: teachersWithRatings });
  } catch (error) {
    console.error("Error fetching available teachers:", error);
    return ApiResponses.serverError("Öğretmenler yüklenirken bir hata oluştu");
  }
});
