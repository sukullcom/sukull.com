import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { isTeacher } from "@/db/queries";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ✅ GET TEACHER MEET LINK
export const GET = secureApi.auth(async (request, user) => {
  try {
    // Check if user is a teacher
    const userIsTeacher = await isTeacher(user.id);
    if (!userIsTeacher) {
      return ApiResponses.forbidden("Only teachers can access meet link");
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
    console.error("Error fetching meet link:", error);
    return ApiResponses.serverError("An error occurred while fetching meet link");
  }
});

// ✅ UPDATE TEACHER MEET LINK
export const POST = secureApi.auth(async (request, user) => {
  try {
    // Check if user is a teacher
    const userIsTeacher = await isTeacher(user.id);
    if (!userIsTeacher) {
      return ApiResponses.forbidden("Only teachers can update meet link");
    }

    const { meetLink } = await request.json();

    // Validate meet link format (basic validation)
    if (meetLink && !meetLink.includes('meet.google.com')) {
      return ApiResponses.badRequest("Please provide a valid Google Meet link");
    }

    // Update the meet link
    await db.update(users)
      .set({ 
        meetLink: meetLink || null,
        updated_at: new Date()
      })
      .where(eq(users.id, user.id));

    return ApiResponses.success({
      message: "Meet link updated successfully",
      meetLink: meetLink || ""
    });
  } catch (error) {
    console.error("Error updating meet link:", error);
    return ApiResponses.serverError("An error occurred while updating meet link");
  }
}); 