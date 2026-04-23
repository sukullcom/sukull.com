import { NextResponse } from "next/server";
import {
  approveTeacherApplication,
  approveTeacherApplicationWithFields,
  rejectTeacherApplication,
} from "@/db/queries";
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
      logAdminActionAsync({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "teacher_application.approve",
        targetType: "teacher_application",
        targetId: applicationId,
        metadata: { selectedFields: selectedFields ?? null },
      });
      return NextResponse.json(
        { message: "Eğitmen başvurusu başarıyla onaylandı" },
        { status: 200 },
      );
    } else if (action === "reject") {
      await rejectTeacherApplication(applicationId);
      logAdminActionAsync({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "teacher_application.reject",
        targetType: "teacher_application",
        targetId: applicationId,
      });
      return NextResponse.json(
        { message: "Eğitmen başvurusu reddedildi" },
        { status: 200 },
      );
    } else {
      return NextResponse.json({ message: "Geçersiz işlem" }, { status: 400 });
    }
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/admin/teacher-applications" } }))
      .error({ message: "teacher application update failed", error, location: "api/admin/teacher-applications/[id]" });
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
}
