import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { privateLessonApplications } from "@/db/schema";
import { eq, and, or, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }

    const application = await db.query.privateLessonApplications.findFirst({
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
    console.error("Başvuru durumu kontrol hatası:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      studentName,
      studentSurname,
      studentPhoneNumber,
      studentEmail,
      field,
      studentNeeds = ""
    } = body;

    if (!studentName || !studentSurname || !studentPhoneNumber || !studentEmail || !field) {
      return NextResponse.json(
        { error: "Lütfen tüm zorunlu alanları doldurun" },
        { status: 400 }
      );
    }

    const existingApplication = await db.query.privateLessonApplications.findFirst({
      where: (apps, { eq, or }) => and(
        eq(apps.userId, user.id),
        or(eq(apps.status, "pending"), eq(apps.status, "approved"))
      ),
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Zaten aktif bir başvurunuz bulunmaktadır" },
        { status: 400 }
      );
    }

    // Create student application
    const application = await db.insert(privateLessonApplications).values({
      userId: user.id,
      studentName,
      studentSurname,
      studentPhoneNumber,
      studentEmail,
      field,
      studentNeeds,
      status: "pending",
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      message: "Başvurunuz başarıyla gönderildi",
      application: application[0]
    }, { status: 201 });

  } catch (error) {
    console.error("Başvuru gönderme hatası:", error);
    return NextResponse.json(
      { error: "Başvurunuz gönderilirken bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
} 