import { NextRequest, NextResponse } from "next/server";
import { secureApi } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit-db";
import { getTeacherAvailabilityForCurrentWeek, getTeacherFields, isApprovedStudent } from "@/db/queries";
import { getRequestLogger } from "@/lib/logger";
import { and, eq, gte, lte, not } from "drizzle-orm";
import db from "@/db/drizzle";
import { lessonBookings, users, userProgress, teacherApplications } from "@/db/schema";

// Define interfaces for the availability and booking slots
interface AvailabilitySlot {
  id: number;
  teacherId: string;
  startTime: Date;
  endTime: Date;
  dayOfWeek: number;
  weekStartDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BookingSlot {
  id: number;
  studentId: string;
  teacherId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  meetLink?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Teacher detail endpoint fan-outs to 4 separate queries (user + profile +
 * application + fields + availability + bookings). Expensive per call,
 * and a student browsing teachers can legitimately hit 10-30/min while
 * comparing. 60/min/user balances UX with DB protection.
 */
export const GET = secureApi.authRateLimited(
  { bucket: "teacher-details-get", keyKind: "user", ...RATE_LIMITS.teacherDetails },
  async (_request: NextRequest, user, params) => {
  try {
    const id = (params?.id as string | undefined) ?? "";
    if (!id) {
      return NextResponse.json({ message: "Eğitmen kimliği gerekli" }, { status: 400 });
    }

    const approved = await isApprovedStudent(user.id);
    if (!approved) {
      return NextResponse.json({ message: "Öğretmen bilgilerini görüntülemek için onaylı öğrenci olmanız gerekiyor" }, { status: 403 });
    }

    const teacherId = id;
    
    const teacher = await db.query.users.findFirst({
      where: eq(users.id, teacherId),
      columns: {
        id: true,
        name: true,
        email: true,
        description: true,
        avatar: true,
      }
    });
    
    if (!teacher) {
      return NextResponse.json({ message: "Eğitmen bulunamadı" }, { status: 404 });
    }
    
    // Get teacher profile image from userProgress
    const teacherProfile = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, teacherId),
      columns: {
        userImageSrc: true,
      }
    });
    
    // Get teacher application details for field
    const teacherApplication = await db.query.teacherApplications.findFirst({
      where: eq(teacherApplications.userId, teacherId),
      columns: {
        field: true,
      }
    });
    
    // Get teacher fields from the new system
    const teacherFieldsData = await getTeacherFields(teacherId);
    
    // Determine field display - use new system if available, fallback to legacy
    let fieldDisplay = "";
    let fields: string[] = [];
    
    if (teacherFieldsData && teacherFieldsData.length > 0) {
      fields = teacherFieldsData.map(f => f.displayName);
      fieldDisplay = fields.join(", ");
    } else if (teacherApplication?.field) {
      fieldDisplay = teacherApplication.field;
      fields = [teacherApplication.field];
    }
    
    // Combine all teacher details
    const teacherWithDetails = {
      ...teacher,
      bio: teacher.description,
      avatar: teacherProfile?.userImageSrc || teacher.avatar,
      field: fieldDisplay,
      fields: fields, // Array of all fields
    };
    
    // Get availability for the current week
    let availability: AvailabilitySlot[] = [];
    try {
      const availabilityData = await getTeacherAvailabilityForCurrentWeek(teacherId);
      const now = new Date();
      
      // Filter out past time slots
      availability = (availabilityData as AvailabilitySlot[]).filter(slot => {
        return slot.startTime > now;
      });
    } catch (availabilityError) {
      {
        const log = await getRequestLogger({ labels: { route: "api/private-lesson/teacher-details/[id]", op: "availability-inner" } });
        log.error({ message: "fetch availability inner failed", error: availabilityError, location: "api/private-lesson/teacher-details/[id]/availability" });
      }
      // Continue without availability data
    }
    
    // Get booked slots for the current week
    let bookedSlots: BookingSlot[] = [];
    try {
      // Get the current week's start and end dates
      const today = new Date();
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Adjust to get Monday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      // Query the database for bookings within this week
      const bookingSlotsData = await db.query.lessonBookings.findMany({
        where: and(
          eq(lessonBookings.teacherId, teacherId),
          gte(lessonBookings.startTime, startOfWeek),
          lte(lessonBookings.startTime, endOfWeek),
          // Include all bookings that aren't cancelled
          not(eq(lessonBookings.status, "cancelled"))
        )
      });
      
      bookedSlots = bookingSlotsData as BookingSlot[];
    } catch (bookingsError) {
      {
        const log = await getRequestLogger({ labels: { route: "api/private-lesson/teacher-details/[id]", op: "bookings" } });
        log.error({ message: "fetch booked slots failed", error: bookingsError, location: "api/private-lesson/teacher-details/[id]/bookings" });
      }
      // Continue without booked slots data
    }
    
    return NextResponse.json({
      teacher: teacherWithDetails,
      availability,
      bookedSlots,
    });
  } catch (error) {
    {
      const log = await getRequestLogger({ labels: { route: "api/private-lesson/teacher-details/[id]", op: "GET" } });
      log.error({ message: "get teacher details failed", error, location: "api/private-lesson/teacher-details/[id]/GET" });
    }
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
  },
);

/**
 * PATCH updates the teacher's own bio. Own-resource writes — generous
 * authRead bucket is plenty since the UI saves on blur/submit only.
 */
export const PATCH = secureApi.authRateLimited(
  { bucket: "teacher-details-patch", keyKind: "user", ...RATE_LIMITS.writeBurst },
  async (request: NextRequest, user, params) => {
    try {
      const id = (params?.id as string | undefined) ?? "";
      if (user.id !== id) {
        return NextResponse.json(
          { message: "Yalnızca kendi profilinizi güncelleyebilirsiniz" },
          { status: 403 },
        );
      }

      const data = await request.json();

      if (data.bio !== undefined) {
        await db.update(users).set({ description: data.bio }).where(eq(users.id, user.id));
      }

      return NextResponse.json({ message: "Profil başarıyla güncellendi", updated: true });
    } catch (error) {
      {
        const log = await getRequestLogger({ labels: { route: "api/private-lesson/teacher-details/[id]", op: "PUT" } });
        log.error({ message: "update teacher profile failed", error, location: "api/private-lesson/teacher-details/[id]/PUT" });
      }
      return NextResponse.json(
        { message: "Profil güncellenirken bir hata oluştu" },
        { status: 500 },
      );
    }
  },
);
