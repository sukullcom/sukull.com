import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { getAvailableTeachers } from "@/db/queries";

export const GET = secureApi.auth(async () => {
  try {
    const teachers = await getAvailableTeachers();
    return ApiResponses.success({ teachers });
  } catch (error) {
    console.error("Error fetching available teachers:", error);
    return ApiResponses.serverError("Failed to fetch available teachers");
  }
});
