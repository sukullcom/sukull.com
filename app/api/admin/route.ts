import { NextRequest, NextResponse } from "next/server";
import { getAdminActor, isAdmin } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";
import { getRequestLogger } from "@/lib/logger";
import {
  getAvailableFieldOptions,
  approveTeacherApplication,
  rejectTeacherApplication,
  getTeacherApplicationsPaginated,
  type ApplicationStatusFilter,
} from "@/db/queries";
import { detectOrphanPayments } from "@/actions/payment-reconciliation";

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

      case 'orphan-payments': {
        // "Iyzico'da başarılı ama bizde hizmet açılmamış" durumları.
        // Cron her gece tarayıp `error_log`'a yazıyor; bu uç manuel
        // reconcile için admin paneline canlı liste sağlar.
        const days = Math.min(Math.max(1, Number(searchParams.get('days') ?? '7')), 30);
        const orphans = await detectOrphanPayments(days);
        return NextResponse.json({ orphans, windowDays: days });
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
        const { applicationId } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Başvuru kimliği gereklidir." }, { status: 400 });
        }

        const result = await approveTeacherApplication(applicationId);

        const actor = await getAdminActor();
        if (actor) {
          logAdminActionAsync({
            actorId: actor.id,
            actorEmail: actor.email,
            action: "teacher_application.approve",
            targetType: "teacher_application",
            targetId: applicationId,
          });
        }

        return NextResponse.json({ message: "Eğitmen başvurusu başarıyla onaylandı.", result });
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

        return NextResponse.json({ message: "Eğitmen başvurusu reddedildi." });
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

// PATCH /api/admin: removed in favour of `/api/admin/teacher-applications/[id]`
// (the active route the UI already calls). The old handler parsed the last URL
// segment expecting a numeric id, but for this route that segment is the
// literal "admin", so every call returned 400. Kept here as a comment trail
// for any contributor who hits an old PATCH /api/admin reference.
