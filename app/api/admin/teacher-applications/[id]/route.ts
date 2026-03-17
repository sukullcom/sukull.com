import { NextResponse } from "next/server";
import { approveTeacherApplication, approveTeacherApplicationWithFields, rejectTeacherApplication } from "@/db/queries";
import { isAdmin } from "@/lib/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await isAdmin();
    
    if (!admin) {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id } = params;
    const { action, selectedFields } = await request.json();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: "Geçersiz başvuru kimliği" }, { status: 400 });
    }

    const applicationId = parseInt(id);

    if (action === "approve") {
      if (selectedFields && selectedFields.length > 0) {
        await approveTeacherApplicationWithFields(applicationId, selectedFields);
      } else {
        await approveTeacherApplication(applicationId);
      }
      return NextResponse.json({ message: "Eğitmen başvurusu başarıyla onaylandı" }, { status: 200 });
    } else if (action === "reject") {
      await rejectTeacherApplication(applicationId);
      return NextResponse.json({ message: "Eğitmen başvurusu reddedildi" }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Geçersiz işlem" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Teacher Application] Error:", error);
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
}
