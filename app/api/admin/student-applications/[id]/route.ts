import { NextResponse } from "next/server";
import { approveStudentApplication, rejectStudentApplication } from "@/db/queries";
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
    const { action } = await request.json();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: "Geçersiz başvuru kimliği" }, { status: 400 });
    }

    const applicationId = parseInt(id);

    if (action === "approve") {
      await approveStudentApplication(applicationId);
      return NextResponse.json({ message: "Öğrenci başvurusu başarıyla onaylandı" }, { status: 200 });
    } else if (action === "reject") {
      await rejectStudentApplication(applicationId);
      return NextResponse.json({ message: "Öğrenci başvurusu reddedildi" }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Geçersiz işlem" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Student Application] Error:", error);
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
}
