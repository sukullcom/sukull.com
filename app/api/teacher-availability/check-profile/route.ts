import { NextResponse } from "next/server";
import { isTeacher } from "@/db/queries";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { teacherApplications, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }
    
    const userIsTeacher = await isTeacher(user.id);
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Bu alana yalnızca eğitmenler erişebilir" }, { status: 403 });
    }
    
    const [teacherProfile, userProfile] = await Promise.all([
      db.query.teacherApplications.findFirst({
        where: eq(teacherApplications.userId, user.id),
        columns: {
          field: true,
        }
      }),
      db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: {
          meetLink: true,
          description: true,
        }
      })
    ]);
    
    const missingInfo = [];
    
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
      return NextResponse.json({ 
        message: `Müsaitlik bilgilerinizi düzenleyebilmek için önce profil bilgilerinizi tamamlamanız gerekmektedir.\n\nEksik bilgiler: ${missingText}\n\nLütfen "Özel Ders Ver" > "Öğretmen Paneli" sayfasından profil bilgilerinizi tamamlayın.`,
        missingFields: missingInfo,
        redirectTo: "/private-lesson/teacher-dashboard",
        isComplete: false
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: "Profil tamamlanmış",
      isComplete: true
    });
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/teacher-availability/check-profile" } }))
      .error({ message: "check teacher profile failed", error, location: "api/teacher-availability/check-profile" });
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
}
