import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeacherAvailability, getWeekStartDate, upsertTeacherAvailability, isTeacher } from "@/db/queries";
import { secureApi } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit-db";
import { getRequestLogger } from "@/lib/logger";
import db from "@/db/drizzle";
import { teacherApplications, users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Teachers occasionally reload the availability editor; 60/min/user is
 * ample. Per-user (not per-IP) because one teacher might share an IP.
 */
export const GET = secureApi.authRateLimited(
  { bucket: "teacher-availability-get", keyKind: "user", ...RATE_LIMITS.teacherAvailability },
  async (_request: NextRequest, user) => {
    try {
      const userIsTeacher = await isTeacher(user.id);
      if (!userIsTeacher) {
        return NextResponse.json(
          { message: "Müsaitlik bilgilerine yalnızca eğitmenler erişebilir" },
          { status: 403 },
        );
      }

      const availability = await getCurrentTeacherAvailability(user.id);
      return NextResponse.json({ availability });
    } catch (error) {
      {
        const log = await getRequestLogger({ labels: { route: "api/teacher-availability", op: "GET" } });
        log.error({ message: "fetch teacher availability failed", error, location: "api/teacher-availability/GET" });
      }
      return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
    }
  },
);

/**
 * Writes upsert a potentially large slot batch. 60/min still allows rapid
 * drag-to-fill edits; blocks scripted grid-sweep abuse.
 */
export const POST = secureApi.authRateLimited(
  { bucket: "teacher-availability-post", keyKind: "user", ...RATE_LIMITS.teacherAvailability },
  async (req: NextRequest, user) => {
    try {
      const userIsTeacher = await isTeacher(user.id);
      if (!userIsTeacher) {
        return NextResponse.json(
          { message: "Müsaitlik bilgilerini yalnızca eğitmenler güncelleyebilir" },
          { status: 403 },
        );
      }

      const [teacherProfile, userProfile] = await Promise.all([
        db.query.teacherApplications.findFirst({
          where: eq(teacherApplications.userId, user.id),
          columns: { field: true },
        }),
        db.query.users.findFirst({
          where: eq(users.id, user.id),
          columns: { meetLink: true, description: true },
        }),
      ]);

      const missingInfo: string[] = [];

      if (!teacherProfile?.field || teacherProfile.field === "Belirtilmemiş") {
        missingInfo.push("Uzmanlık Alanı");
      }

      if (!userProfile?.meetLink || userProfile.meetLink.trim() === "") {
        missingInfo.push("Google Meet Linki");
      }

      if (!userProfile?.description || userProfile.description.trim() === "") {
        missingInfo.push("Biyografi");
      }

      if (missingInfo.length > 0) {
        const missingText = missingInfo.join(", ");
        return NextResponse.json(
          {
            message: `Müsaitlik bilgilerinizi düzenleyebilmek için önce profil bilgilerinizi tamamlamanız gerekmektedir.\n\nEksik bilgiler: ${missingText}\n\nLütfen "Özel Ders Ver" > "Öğretmen Paneli" sayfasından profil bilgilerinizi tamamlayın.`,
            missingFields: missingInfo,
            redirectTo: "/private-lesson/teacher-dashboard",
          },
          { status: 400 },
        );
      }

      const body = await req.json();
      const { slots } = body;

      if (!Array.isArray(slots)) {
        return NextResponse.json({ message: "Geçersiz zaman dilimi formatı" }, { status: 400 });
      }

      const now = new Date();
      const weekStartDate = getWeekStartDate(now);

      const processedSlots = slots.map((slot) => {
        const startTime =
          typeof slot.startTime === "string" ? new Date(slot.startTime) : slot.startTime;
        const endTime =
          typeof slot.endTime === "string" ? new Date(slot.endTime) : slot.endTime;
        return { startTime, endTime, dayOfWeek: slot.dayOfWeek };
      });

      const futureSlots: typeof processedSlots = [];
      const pastSlots: typeof processedSlots = [];

      for (const slot of processedSlots) {
        const { startTime, endTime } = slot;

        if (
          startTime.getMinutes() % 30 !== 0 ||
          endTime.getMinutes() % 30 !== 0 ||
          endTime.getTime() - startTime.getTime() !== 30 * 60 * 1000
        ) {
          return NextResponse.json(
            { message: "Geçersiz zaman dilimi. Tüm slotlar 30 dakikalık aralıklarla olmalıdır." },
            { status: 400 },
          );
        }

        if (startTime < now) {
          pastSlots.push(slot);
        } else {
          futureSlots.push(slot);
        }
      }

      const hasFilteredSlots = pastSlots.length > 0;

      try {
        const savedSlots = await upsertTeacherAvailability(user.id, weekStartDate, futureSlots);

        return NextResponse.json({
          message: hasFilteredSlots
            ? "Müsaitlik bilgileri güncellendi. Geçmiş zaman dilimleri otomatik olarak kaldırıldı."
            : "Müsaitlik bilgileri başarıyla güncellendi",
          availability: savedSlots,
          filtered: hasFilteredSlots,
          filteredCount: pastSlots.length,
        });
      } catch (error) {
        {
          const log = await getRequestLogger({ labels: { route: "api/teacher-availability", op: "save" } });
          log.error({ message: "save teacher availability db error", error, location: "api/teacher-availability/save" });
        }
        return NextResponse.json(
          { message: "Müsaitlik bilgileri kaydedilirken bir hata oluştu" },
          { status: 500 },
        );
      }
    } catch (error) {
      {
        const log = await getRequestLogger({ labels: { route: "api/teacher-availability", op: "PUT" } });
        log.error({ message: "update teacher availability failed", error, location: "api/teacher-availability/PUT" });
      }
      return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
    }
  },
);

