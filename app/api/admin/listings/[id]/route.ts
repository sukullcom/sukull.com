import { NextResponse } from "next/server";
import { adminSetListingStatus } from "@/db/queries";
import { getAdminActor } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 401 });
    }

    const id = Number.parseInt(params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ message: "Geçersiz ilan" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
    };
    if (body.action === "approve") {
      const row = await adminSetListingStatus(id, "open");
      if (!row) {
        return NextResponse.json({ message: "İlan bulunamadı" }, { status: 404 });
      }
      logAdminActionAsync({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "listing.approve",
        targetType: "listing",
        targetId: id,
      });
      return NextResponse.json({ message: "İlan yayına alındı" });
    }
    if (body.action === "reject") {
      const row = await adminSetListingStatus(id, "rejected");
      if (!row) {
        return NextResponse.json({ message: "İlan bulunamadı" }, { status: 404 });
      }
      logAdminActionAsync({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "listing.reject",
        targetType: "listing",
        targetId: id,
      });
      return NextResponse.json({ message: "İlan reddedildi" });
    }

    return NextResponse.json({ message: "Geçersiz işlem" }, { status: 400 });
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/admin/listings" } }))
      .error({ message: "listing moderation failed", error, location: "api/admin/listings/[id]" });
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
}
