import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { users, teacherApplications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isTeacher, getTeacherFields } from "@/db/queries";

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
    
    const userDetails = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    
    if (!userDetails) {
      return NextResponse.json({ message: "Kullanıcı bilgileri bulunamadı" }, { status: 404 });
    }
    
    const teacherApplication = await db.query.teacherApplications.findFirst({
      where: eq(teacherApplications.userId, user.id),
    });
    
    const teacherFieldsData = await getTeacherFields(user.id);
    
    let fieldDisplay = "";
    let fields: string[] = [];
    
    if (teacherFieldsData && teacherFieldsData.length > 0) {
      fields = teacherFieldsData.map(f => f.displayName);
      fieldDisplay = fields.join(", ");
    } else if (teacherApplication?.field) {
      fieldDisplay = teacherApplication.field;
      fields = [teacherApplication.field];
    }
    
    const teacherProfile = {
      id: userDetails.id,
      name: userDetails.name,
      email: userDetails.email,
      avatar: userDetails.avatar,
      bio: userDetails.description,
      meetLink: userDetails.meetLink,
      field: fieldDisplay,
      fields: fields,
    };
    
    return NextResponse.json(teacherProfile);
  } catch (error) {
    console.error("Error getting teacher profile:", error);
    return NextResponse.json({ 
      message: "Eğitmen profili yüklenirken bir hata oluştu"
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }
    
    const userIsTeacher = await isTeacher(user.id);
    
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Bu alana yalnızca eğitmenler erişebilir" }, { status: 403 });
    }
    
    const data: { bio?: string } = await request.json();
    
    if (data.bio !== undefined) {
      await db
        .update(users)
        .set({ description: data.bio })
        .where(eq(users.id, user.id));
    }
    
    return NextResponse.json({ 
      message: "Profil başarıyla güncellendi",
      updated: true
    });
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    return NextResponse.json({ 
      message: "Profil güncellenirken bir hata oluştu"
    }, { status: 500 });
  }
}
