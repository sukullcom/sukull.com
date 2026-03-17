import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { isApprovedStudent } from "@/db/queries";
import { getTeachersWithRatingsOptimized } from "@/db/optimized-queries";
import { NextRequest } from "next/server";

export const GET = secureApi.auth(async (_request: NextRequest, user) => {
  try {
    const approved = await isApprovedStudent(user.id);
    if (!approved) {
      return ApiResponses.forbidden("Öğretmenleri görüntülemek için onaylı öğrenci olmanız gerekiyor");
    }
    const teachers = await getTeachersWithRatingsOptimized();
    return ApiResponses.success({ teachers });
  } catch (error) {
    console.error("Error fetching available teachers:", error);
    return ApiResponses.serverError("Öğretmenler yüklenirken bir hata oluştu");
  }
});
