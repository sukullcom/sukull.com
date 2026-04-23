import { NextRequest, NextResponse } from "next/server";
import { getAdminActor, isAdmin } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";
import { getRequestLogger } from "@/lib/logger";
import {
  getAvailableFieldOptions,
  approveTeacherApplication,
  approveTeacherApplicationWithFields,
  rejectTeacherApplication,
  getTeacherApplicationsPaginated,
  getStudentApplicationsPaginated,
  approveStudentApplication,
  rejectStudentApplication,
  type ApplicationStatusFilter,
} from "@/db/queries";

/**
 * Parse `?page`, `?pageSize`, `?status`, `?q` into the shape expected by
 * the paginated query helpers. Clamping lives in the helpers themselves
 * (`normalizePagination`) so API callers can't request a 10K-row window.
 */
function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");
  const rawStatus = searchParams.get("status");
  const status: ApplicationStatusFilter | undefined =
    rawStatus === "pending" ||
    rawStatus === "approved" ||
    rawStatus === "rejected" ||
    rawStatus === "all"
      ? rawStatus
      : undefined;
  const q = searchParams.get("q") ?? undefined;
  return { page, pageSize, status, q };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'field-options': {
        const fieldOptions = await getAvailableFieldOptions();
        return NextResponse.json(fieldOptions);
      }

      case 'teacher-applications': {
        // Paginated: response shape is
        //   { applications, total, statusCounts, page, pageSize }
        // The legacy `{ applications }`-only shape is preserved as a
        // subset so older clients still work until they are updated.
        const pagination = parsePaginationParams(searchParams);
        const result = await getTeacherApplicationsPaginated(pagination);
        return NextResponse.json({
          applications: result.rows,
          total: result.total,
          statusCounts: result.statusCounts,
          page: result.page,
          pageSize: result.pageSize,
        });
      }

      case 'student-applications': {
        const pagination = parsePaginationParams(searchParams);
        const result = await getStudentApplicationsPaginated(pagination);
        return NextResponse.json({
          applications: result.rows,
          total: result.total,
          statusCounts: result.statusCounts,
          page: result.page,
          pageSize: result.pageSize,
        });
      }

      default: {
        return NextResponse.json({ 
          error: "Geçersiz istek parametresi." 
        }, { status: 400 });
      }
    }
  } catch (error) {
    const log = await getRequestLogger({ labels: { route: "api/admin", op: "GET" } });
    log.error({ message: "admin GET failed", error, location: "api/admin/GET", fields: { url: request.url } });
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'approve-teacher': {
        const { applicationId, fields } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Başvuru kimliği gereklidir." }, { status: 400 });
        }

        let result;
        if (fields && fields.length > 0) {
          result = await approveTeacherApplicationWithFields(applicationId, fields);
        } else {
          result = await approveTeacherApplication(applicationId);
        }

        const actor = await getAdminActor();
        if (actor) {
          logAdminActionAsync({
            actorId: actor.id,
            actorEmail: actor.email,
            action: "teacher_application.approve",
            targetType: "teacher_application",
            targetId: applicationId,
            metadata: { fields: fields ?? null },
          });
        }

        return NextResponse.json({ message: "Öğretmen başvurusu başarıyla onaylandı.", result });
      }

      case 'reject-teacher': {
        const { applicationId } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Başvuru kimliği gereklidir." }, { status: 400 });
        }

        await rejectTeacherApplication(applicationId);

        const actor = await getAdminActor();
        if (actor) {
          logAdminActionAsync({
            actorId: actor.id,
            actorEmail: actor.email,
            action: "teacher_application.reject",
            targetType: "teacher_application",
            targetId: applicationId,
          });
        }

        return NextResponse.json({ message: "Öğretmen başvurusu reddedildi." });
      }

      case 'approve-student': {
        const { applicationId } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Başvuru kimliği gereklidir." }, { status: 400 });
        }

        await approveStudentApplication(applicationId);

        const actor = await getAdminActor();
        if (actor) {
          logAdminActionAsync({
            actorId: actor.id,
            actorEmail: actor.email,
            action: "student_application.approve",
            targetType: "student_application",
            targetId: applicationId,
          });
        }

        return NextResponse.json({ message: "Öğrenci başvurusu başarıyla onaylandı." });
      }

      case 'reject-student': {
        const { applicationId } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Başvuru kimliği gereklidir." }, { status: 400 });
        }

        await rejectStudentApplication(applicationId);

        const actor = await getAdminActor();
        if (actor) {
          logAdminActionAsync({
            actorId: actor.id,
            actorEmail: actor.email,
            action: "student_application.reject",
            targetType: "student_application",
            targetId: applicationId,
          });
        }

        return NextResponse.json({ message: "Öğrenci başvurusu reddedildi." });
      }

      default: {
        return NextResponse.json({ 
          error: "Geçersiz istek parametresi." 
        }, { status: 400 });
      }
    }
  } catch (error) {
    const log = await getRequestLogger({ labels: { route: "api/admin", op: "POST" } });
    log.error({ message: "admin POST failed", error, location: "api/admin/POST", fields: { url: request.url } });
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 401 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: "Geçersiz başvuru kimliği." }, { status: 400 });
    }

    const { action, selectedFields } = await request.json();
    const applicationId = parseInt(id);

    if (action === "approve") {
      if (selectedFields && selectedFields.length > 0) {
        await approveTeacherApplicationWithFields(applicationId, selectedFields);
      } else {
        await approveTeacherApplication(applicationId);
      }

      const actor = await getAdminActor();
      if (actor) {
        logAdminActionAsync({
          actorId: actor.id,
          actorEmail: actor.email,
          action: "teacher_application.approve",
          targetType: "teacher_application",
          targetId: applicationId,
          metadata: { selectedFields: selectedFields ?? null, via: "PATCH" },
        });
      }

      return NextResponse.json({ message: "Başvuru başarıyla onaylandı." });
    } else if (action === "reject") {
      await rejectTeacherApplication(applicationId);

      const actor = await getAdminActor();
      if (actor) {
        logAdminActionAsync({
          actorId: actor.id,
          actorEmail: actor.email,
          action: "teacher_application.reject",
          targetType: "teacher_application",
          targetId: applicationId,
          metadata: { via: "PATCH" },
        });
      }

      return NextResponse.json({ message: "Başvuru reddedildi." });
    } else {
      return NextResponse.json({ message: "Geçersiz işlem." }, { status: 400 });
    }
  } catch (error) {
    const log = await getRequestLogger({ labels: { route: "api/admin", op: "PATCH" } });
    log.error({ message: "admin PATCH failed", error, location: "api/admin/PATCH" });
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}
