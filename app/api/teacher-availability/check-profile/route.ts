import { NextResponse } from "next/server";
import { isTeacher } from "@/db/queries";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { teacherApplications, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET check if teacher profile is complete
export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the user is a teacher using the isTeacher function
    const userIsTeacher = await isTeacher(user.id);
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Only teachers can check profile" }, { status: 403 });
    }
    
    // Check if teacher has completed their profile information
    const [teacherProfile, userProfile] = await Promise.all([
      db.query.teacherApplications.findFirst({
        where: eq(teacherApplications.userId, user.id),
        columns: {
          field: true,
          priceRange: true,
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
    
    // Check teacher application fields
    if (!teacherProfile?.field || teacherProfile.field === "Belirtilmemiş") {
      missingInfo.push("Uzmanlık Alanı");
    }
    
    if (!teacherProfile?.priceRange) {
      missingInfo.push("Fiyat Aralığı");
    }
    
    // Check user profile fields
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
      message: "Profile is complete",
      isComplete: true
    });
  } catch (error) {
    console.error("Error checking teacher profile:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 