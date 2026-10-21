"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gt, inArray } from "drizzle-orm";

import db from "@/db/drizzle";
import { serviceRequests } from "@/db/schema";
import { getAdminActor } from "@/lib/admin";
import { logAdminAction } from "@/lib/admin-audit";

type Result = { ok: true } | { error: string };

const NOTE_MAX = 500;

function refresh(customerPath: number) {
  revalidatePath("/admin/hizmet-ilanlari");
  revalidatePath("/admin/hizmet-ilanlari/analitik");
  revalidatePath("/islerim");
  revalidatePath(`/islerim/${customerPath}`);
  revalidatePath("/hizmet-veren/ilanlar");
  revalidatePath("/");
}

export async function approveServiceRequest(requestId: number): Promise<Result> {
  const actor = await getAdminActor();
  if (!actor) return { error: "Yetkin yok." };
  if (!Number.isInteger(requestId)) return { error: "Geçersiz ilan." };

  const [row] = await db
    .update(serviceRequests)
    .set({ status: "open", rejectionNote: null, reviewedAt: new Date(), reviewedBy: actor.id, updatedAt: new Date() })
    .where(
      and(
        eq(serviceRequests.id, requestId),
        inArray(serviceRequests.status, ["pending", "rejected"]),
        gt(serviceRequests.expiresAt, new Date()),
      ),
    )
    .returning({ id: serviceRequests.id });
  if (!row) return { error: "Bu ilan onaylanamaz. Süresi dolmuş ya da kapatılmış olabilir." };

  await logAdminAction({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "service_request.approve",
    targetType: "service_request",
    targetId: requestId,
  });
  refresh(requestId);
  return { ok: true };
}

export async function rejectServiceRequest(requestId: number, note: string): Promise<Result> {
  const actor = await getAdminActor();
  if (!actor) return { error: "Yetkin yok." };
  if (!Number.isInteger(requestId)) return { error: "Geçersiz ilan." };
  const reason = (note ?? "").trim();
  if (reason.length < 3) return { error: "Reddetme nedenini kısaca yaz." };
  if (reason.length > NOTE_MAX) return { error: `Not en fazla ${NOTE_MAX} karakter olabilir.` };

  const [row] = await db
    .update(serviceRequests)
    .set({ status: "rejected", rejectionNote: reason, reviewedAt: new Date(), reviewedBy: actor.id, updatedAt: new Date() })
    .where(and(eq(serviceRequests.id, requestId), inArray(serviceRequests.status, ["pending", "open"])))
    .returning({ id: serviceRequests.id });
  if (!row) return { error: "Bu ilan reddedilemez." };

  await logAdminAction({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "service_request.reject",
    targetType: "service_request",
    targetId: requestId,
    metadata: { note: reason },
  });
  refresh(requestId);
  return { ok: true };
}
