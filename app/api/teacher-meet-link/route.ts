import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { isTeacher } from "@/db/queries";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRequestLogger } from "@/lib/logger";

// ✅ GET TEACHER MEET LINK
export const GET = secureApi.auth(async (request, user) => {
  try {
    // Check if user is a teacher
    const userIsTeacher = await isTeacher(user.id);
    if (!userIsTeacher) {
      return ApiResponses.forbidden("Meet bağlantısına yalnızca eğitmenler erişebilir");
    }

    // Get current meet link
    const teacherProfile = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { meetLink: true }
    });

    return ApiResponses.success({
      meetLink: teacherProfile?.meetLink || ""
    });
  } catch (error) {
    {
      const log = await getRequestLogger({ labels: { route: "api/teacher-meet-link", op: "GET" } });
      log.error({ message: "fetch meet link failed", error, location: "api/teacher-meet-link/GET" });
    }
    return ApiResponses.serverError("Meet bağlantısı yüklenirken bir hata oluştu");
  }
});

// ✅ UPDATE TEACHER MEET LINK
export const POST = secureApi.auth(async (request, user) => {
  try {
    // Check if user is a teacher
    const userIsTeacher = await isTeacher(user.id);
    if (!userIsTeacher) {
      return ApiResponses.forbidden("Meet bağlantısını yalnızca eğitmenler güncelleyebilir");
    }

    const { meetLink } = await request.json();

    // Validate meet link format (basic validation)
    if (meetLink && !meetLink.includes('meet.google.com')) {
      return ApiResponses.badRequest("Lütfen geçerli bir Google Meet bağlantısı giriniz");
    }

    // Update the meet link
    await db.update(users)
      .set({ 
        meetLink: meetLink || null,
        updated_at: new Date()
      })
      .where(eq(users.id, user.id));

    return ApiResponses.success({
      message: "Google Meet bağlantısı başarıyla güncellendi",
      meetLink: meetLink || ""
    });
  } catch (error) {
    {
      const log = await getRequestLogger({ labels: { route: "api/teacher-meet-link", op: "PUT" } });
      log.error({ message: "update meet link failed", error, location: "api/teacher-meet-link/PUT" });
    }
    return ApiResponses.serverError("Google Meet bağlantısı güncellenirken bir hata oluştu");
  }
}); 