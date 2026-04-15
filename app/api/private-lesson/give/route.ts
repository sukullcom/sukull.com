import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { teacherApplications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }

    const application = await db.query.teacherApplications.findFirst({
      where: (apps) => eq(apps.userId, user.id),
      orderBy: (apps) => [desc(apps.createdAt)],
    });

    if (!application) {
      return NextResponse.json({ hasApplication: false });
    }

    return NextResponse.json({
      hasApplication: true,
      status: application.status,
      field: application.field,
      createdAt: application.createdAt,
    });
  } catch (error) {
    console.error("Teacher application status check error:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      teacherName,
      teacherSurname,
      teacherPhoneNumber,
      teacherEmail,
      field,
      quizResult = 0,
      passed = true,
      education = null,
      experienceYears = null,
      targetLevels = null,
      availableHours = null,
      lessonMode = null,
      hourlyRate = null,
      bio = null,
    } = body;

    // Validate required fields
    if (!teacherName || !teacherSurname || !teacherPhoneNumber || !teacherEmail || !field) {
      return NextResponse.json(
        { error: "Lütfen tüm gerekli alanları doldurun" },
        { status: 400 }
      );
    }

    // Check if user already has a teacher application
    const existingApplication = await db.query.teacherApplications.findFirst({
      where: (teacherApplications, { eq }) => eq(teacherApplications.userId, user.id),
    });

    if (existingApplication) {
      if (existingApplication.status === "pending") {
        return NextResponse.json(
          { error: "Başvurunuz zaten inceleme sürecindedir. Lütfen sonucu bekleyin." },
          { status: 400 }
        );
      }
      if (existingApplication.status === "approved") {
        return NextResponse.json(
          { error: "Zaten onaylanmış bir eğitmen hesabınız bulunmaktadır." },
          { status: 400 }
        );
      }
      // Rejected: delete old application so user can re-apply
      await db.delete(teacherApplications)
        .where(eq(teacherApplications.userId, user.id));
    }

    const application = await db.insert(teacherApplications).values({
      userId: user.id,
      field,
      quizResult,
      passed,
      teacherName,
      teacherSurname,
      teacherPhoneNumber,
      teacherEmail,
      education,
      experienceYears,
      targetLevels,
      availableHours,
      lessonMode,
      hourlyRate,
      bio,
      classification: "pending",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({
      message: "Eğitmen başvurunuz başarıyla gönderildi",
      application: application[0]
    }, { status: 201 });

  } catch (error) {
    console.error("Error submitting teacher application:", error);
    return NextResponse.json(
      { error: "Başvurunuz gönderilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 