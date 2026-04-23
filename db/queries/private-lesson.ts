/**
 * Private-lesson booking flow queries.
 *
 * Responsibilities:
 *   - Creating a booking (`bookLesson`) with atomic credit deduction.
 *   - Reading bookings for a student or teacher.
 *   - Writing reviews for completed bookings (`submitLessonReview`).
 *
 * Teacher profile / availability / earnings live in `./teacher`.
 * Application & onboarding flows live in `./applications`.
 */
import { and, desc, eq, not, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import {
  lessonBookings,
  lessonReviews,
  teacherAvailability,
  userCredits,
  users,
} from "@/db/schema";
import { logger } from "@/lib/logger";
import {
  getTeacherApplicationByUserId,
  getTeacherFields,
} from "./applications";

const log = logger.child({ labels: { module: "db/queries/private-lesson" } });

/**
 * Book a lesson inside a single transaction:
 *   1. Consume a credit (fails if availableCredits < 1).
 *   2. Guard against double-booking the same slot.
 *   3. Confirm the slot matches a declared availability row.
 *   4. Insert the booking, carrying over the teacher's meet link.
 */
export async function bookLesson(
  studentId: string,
  teacherId: string,
  startTime: Date,
  endTime: Date,
) {
  return await db.transaction(async (tx) => {
    const creditResult = await tx
      .update(userCredits)
      .set({
        usedCredits: sql`${userCredits.usedCredits} + 1`,
        availableCredits: sql`${userCredits.availableCredits} - 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userCredits.userId, studentId),
          sql`${userCredits.availableCredits} >= 1`,
        ),
      )
      .returning();

    if (creditResult.length === 0) {
      throw new Error(
        "Krediniz yetersiz. Lütfen ders rezervasyonu yapmak için kredi satın alın.",
      );
    }

    const existingBooking = await tx.query.lessonBookings.findFirst({
      where: and(
        eq(lessonBookings.teacherId, teacherId),
        eq(lessonBookings.startTime, startTime),
        eq(lessonBookings.endTime, endTime),
        not(eq(lessonBookings.status, "cancelled")),
      ),
    });

    if (existingBooking) {
      throw new Error("Bu zaman dilimi zaten rezerve edilmiş.");
    }

    const availability = await tx.query.teacherAvailability.findFirst({
      where: and(
        eq(teacherAvailability.teacherId, teacherId),
        eq(teacherAvailability.startTime, startTime),
        eq(teacherAvailability.endTime, endTime),
      ),
    });

    if (!availability) {
      throw new Error("Bu zaman dilimi müsait değil");
    }

    const teacher = await tx.query.users.findFirst({
      where: eq(users.id, teacherId),
      columns: { meetLink: true },
    });

    return tx
      .insert(lessonBookings)
      .values({
        studentId,
        teacherId,
        startTime,
        endTime,
        meetLink: teacher?.meetLink,
      })
      .returning();
  });
}

export async function getStudentBookings(studentId: string) {
  const bookings = await db.query.lessonBookings.findMany({
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
        },
      },
      review: {
        columns: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  log.debug("student bookings fetched", {
    studentId,
    count: bookings.length,
  });

  const bookingsWithField = await Promise.all(
    bookings.map(async (booking) => {
      const teacherFieldsData = await getTeacherFields(booking.teacherId);
      const teacherApplication = await getTeacherApplicationByUserId(
        booking.teacherId,
      );

      let fieldDisplay = "Belirtilmemiş";
      let fields: string[] = [];

      if (teacherFieldsData && teacherFieldsData.length > 0) {
        fields = teacherFieldsData.map((f) => f.displayName);
        fieldDisplay = fields.join(", ");
      } else if (teacherApplication?.field) {
        fieldDisplay = teacherApplication.field;
        fields = [teacherApplication.field];
      }

      return {
        ...booking,
        field: fieldDisplay,
        fields: fields,
      };
    }),
  );

  return bookingsWithField;
}

export async function getTeacherBookings(teacherId: string) {
  const bookings = await db.query.lessonBookings.findMany({
    where: eq(lessonBookings.teacherId, teacherId),
    orderBy: desc(lessonBookings.startTime),
    with: {
      student: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          description: true,
        },
      },
    },
  });

  const teacherFieldsData = await getTeacherFields(teacherId);
  const teacherApplication = await getTeacherApplicationByUserId(teacherId);

  let fieldDisplay = "Belirtilmemiş";
  let fields: string[] = [];

  if (teacherFieldsData && teacherFieldsData.length > 0) {
    fields = teacherFieldsData.map((f) => f.displayName);
    fieldDisplay = fields.join(", ");
  } else if (teacherApplication?.field) {
    fieldDisplay = teacherApplication.field;
    fields = [teacherApplication.field];
  }

  return bookings.map((booking) => {
    const studentName = booking.student?.name || "Unknown Student";
    const studentEmail = booking.student?.email || "";
    const studentUsername = booking.student?.description || "";

    return {
      ...booking,
      field: fieldDisplay,
      fields: fields,
      studentName,
      studentEmail,
      studentUsername,
    };
  });
}

export async function updateBookingStatus(bookingId: number, status: string) {
  return db
    .update(lessonBookings)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(lessonBookings.id, bookingId))
    .returning();
}

/**
 * Submit a rating+comment for a completed booking. Validates:
 *   - The booking exists and belongs to (student, teacher).
 *   - It isn't cancelled.
 *   - The end time is in the past.
 *   - There isn't already a review.
 * If the booking is in "accepted" state but time has passed, it also
 * flips the status to "completed" to keep counts in sync.
 */
export const submitLessonReview = async (
  bookingId: number,
  studentId: string,
  teacherId: string,
  rating: number,
  comment?: string,
) => {
  const booking = await db.query.lessonBookings.findFirst({
    where: and(
      eq(lessonBookings.id, bookingId),
      eq(lessonBookings.studentId, studentId),
      eq(lessonBookings.teacherId, teacherId),
    ),
  });

  if (!booking) {
    throw new Error("Rezervasyon bulunamadı");
  }

  if (booking.status === "cancelled") {
    throw new Error("İptal edilmiş dersler değerlendirilemez");
  }

  const now = new Date();
  if (new Date(booking.endTime) > now) {
    throw new Error(
      "Ders henüz tamamlanmadı. Yalnızca biten dersler değerlendirilebilir.",
    );
  }

  if (booking.status !== "completed") {
    await db
      .update(lessonBookings)
      .set({ status: "completed", updatedAt: now })
      .where(eq(lessonBookings.id, bookingId));
  }

  const existingReview = await db.query.lessonReviews.findFirst({
    where: eq(lessonReviews.bookingId, bookingId),
  });

  if (existingReview) {
    throw new Error("Bu ders için zaten bir değerlendirme yapılmış");
  }

  return await db
    .insert(lessonReviews)
    .values({
      bookingId,
      studentId,
      teacherId,
      rating,
      comment: comment || null,
    })
    .returning();
};
