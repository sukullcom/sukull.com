import { NextResponse } from "next/server";
import { approveStudentApplication, rejectStudentApplication } from "@/db/queries";
import { getAdminActor } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await getAdminActor();

    if (!actor) {
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
      logAdminActionAsync({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "student_application.approve",
        targetType: "student_application",
        targetId: applicationId,
      });
      return NextResponse.json(
        { message: "Öğrenci başvurusu başarıyla onaylandı" },
        { status: 200 },
      );
    } else if (action === "reject") {
      await rejectStudentApplication(applicationId);
      logAdminActionAsync({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "student_application.reject",
        targetType: "student_application",
        targetId: applicationId,
      });
      return NextResponse.json(
        { message: "Öğrenci başvurusu reddedildi" },
        { status: 200 },
      );
    } else {
      return NextResponse.json({ message: "Geçersiz işlem" }, { status: 400 });
    }
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/admin/student-applications" } }))
      .error({ message: "student application update failed", error, location: "api/admin/student-applications/[id]" });
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
}
