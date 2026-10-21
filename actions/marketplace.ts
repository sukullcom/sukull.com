"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

import db from "@/db/drizzle";
import { serviceMessages, serviceQuotes, serviceRequests, serviceReviews, users } from "@/db/schema";
import { getProviderRequest } from "@/db/queries/marketplace";
import { getServerUser } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit-db";
import { findProvince, getNeighborhoods } from "@/lib/marketplace/address";
import { chatOpen } from "@/lib/marketplace/format";
import { notifyCustomerOfQuote, notifyProviderQuoteAccepted } from "@/lib/marketplace/notify";
import {
  normalizeRequestAnswers,
  requestNeedsPlace,
  resolveExpiry,
  type RequestDraft,
} from "@/lib/marketplace/validate-request";

export type ActionError = { error: string };

async function userId(): Promise<string | ActionError> {
  const user = await getServerUser();
  if (!user) return { error: "Devam etmek için giriş yap." };
  return user.id;
}

async function overLimit(name: "serviceRequestCreate" | "serviceQuoteCreate" | "serviceMessageSend", user: string) {
  const limit = await checkRateLimit({ key: `${name}:${user}`, ...RATE_LIMITS[name] });
  return !limit.allowed;
}

function normalizeMobile(raw: string | null | undefined): string | null {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (!/^5\d{9}$/.test(digits)) return null;
  return `+90${digits}`;
}

function quoteError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  if (text.includes("QUOTE_CAP_REACHED")) return "Bu ilan 4 teklif sınırına ulaştı.";
  if (text.includes("REQUEST_NOT_OPEN")) return "Bu ilan artık teklif kabul etmiyor.";
  if (text.includes("CANNOT_QUOTE_OWN_REQUEST")) return "Kendi ilanına teklif veremezsin.";
  if (text.includes("idx_service_quotes_request_provider") || text.includes("duplicate key")) {
    return "Bu ilana zaten teklif verdin.";
  }
  return "Teklif gönderilemedi. Tekrar dene.";
}

export async function createServiceRequest(
  draft: RequestDraft & {
    provinceId: number;
    districtId: number;
    neighborhood: string;
  },
): Promise<ActionError | { id: number }> {
  const auth = await userId();
  if (typeof auth !== "string") return auth;

  const answers = normalizeRequestAnswers(draft);
  if (!answers.ok) return { error: answers.error };

  const details = draft.details.trim();
  if (details.length < 10) return { error: "İhtiyacını en az birkaç cümleyle yaz." };
  if (details.length > 2000) return { error: "Açıklama çok uzun." };

  const remote = !requestNeedsPlace(draft.serviceSlug, answers.answers);
  let city = "Online";
  let districtName = "";
  let neighborhood = "";
  if (!remote) {
    const province = findProvince(draft.provinceId);
    const district = province?.districts.find((item) => item.id === draft.districtId);
    if (!province || !district) return { error: "İl ve ilçe seç." };

    const neighborhoods = getNeighborhoods(province.id, district.id);
    neighborhood = draft.neighborhood.trim();
    if (!neighborhood) return { error: "Mahalle seç." };
    if (neighborhoods.length > 0 && !neighborhoods.includes(neighborhood)) {
      return { error: "Mahalle listeden seçilmeli." };
    }
    city = province.name;
    districtName = district.name;
  }

  const expiry = resolveExpiry(draft.timing, draft.scheduledAt);
  if (!expiry.ok) return { error: expiry.error };

  if (draft.contactChannel !== "phone" && draft.contactChannel !== "email") {
    return { error: "Telefon veya e-posta seç." };
  }

  const savedPhone = draft.contactChannel === "phone" ? normalizeMobile(draft.phone) : null;
  if (draft.contactChannel === "phone" && !savedPhone) {
    return { error: "Cep telefonu 5 ile başlayan 10 hane olmalı." };
  }
  if (await overLimit("serviceRequestCreate", auth)) {
    return { error: "Bugünkü ilan sınırına (5) ulaştın. Yarın tekrar dene." };
  }
  if (savedPhone) {
    await db.update(users).set({ phone: savedPhone, updated_at: new Date() }).where(eq(users.id, auth));
  }

  const [created] = await db
    .insert(serviceRequests)
    .values({
      customerId: auth,
      serviceSlug: draft.serviceSlug,
      answers: answers.answers,
      details,
      city,
      district: districtName,
      neighborhood,
      timingType: draft.timing,
      scheduledAt: expiry.scheduledAt,
      expiresAt: expiry.expiresAt,
      status: "pending",
      contactChannel: draft.contactChannel,
    })
    .returning({ id: serviceRequests.id });

  revalidatePath("/islerim");
  revalidatePath("/admin/hizmet-ilanlari");
  return { id: created.id };
}

export async function submitQuote(input: {
  requestId: number;
  priceTl: number;
  message: string;
}): Promise<ActionError | { id: number }> {
  const auth = await userId();
  if (typeof auth !== "string") return auth;

  const price = Math.round(Number(input.priceTl));
  if (!Number.isFinite(price) || price < 1 || price > 10_000_000) {
    return { error: "Geçerli bir fiyat gir." };
  }
  const message = input.message.trim();
  if (message.length < 2 || message.length > 2000) {
    return { error: "Teklifinle birlikte kısa bir mesaj yaz." };
  }
  const request = await getProviderRequest(auth, input.requestId);
  if (!request || request.customerId === auth) return { error: "Bu ilana teklif veremezsin." };
  if (await overLimit("serviceQuoteCreate", auth)) {
    return { error: "Bugünkü teklif sınırına (20) ulaştın. Yarın tekrar dene." };
  }

  try {
    const created = await db.transaction(async (tx) => {
      const [quote] = await tx
        .insert(serviceQuotes)
        .values({
          requestId: input.requestId,
          providerId: auth,
          priceTl: price,
          message,
          status: "pending",
        })
        .returning({ id: serviceQuotes.id });

      await tx.insert(serviceMessages).values({
        quoteId: quote.id,
        senderId: auth,
        body: message,
      });
      return quote;
    });
    revalidatePath("/hizmet-veren/ilanlar");
    revalidatePath("/hizmet-veren/teklifler");
    revalidatePath("/islerim");
    revalidatePath(`/islerim/${input.requestId}`);
    await notifyCustomerOfQuote({
      quoteId: created.id,
      requestId: input.requestId,
      providerId: auth,
      priceTl: price,
      message,
    });
    return { id: created.id };
  } catch (error) {
    return { error: quoteError(error) };
  }
}

export async function sendServiceMessage(quoteId: number, body: string): Promise<ActionError | { ok: true }> {
  const auth = await userId();
  if (typeof auth !== "string") return auth;
  const text = body.trim();
  if (text.length < 1 || text.length > 2000) return { error: "Mesaj boş olamaz." };

  const [quote] = await db
    .select({
      id: serviceQuotes.id,
      providerId: serviceQuotes.providerId,
      requestId: serviceQuotes.requestId,
      status: serviceQuotes.status,
      customerId: serviceRequests.customerId,
      requestStatus: serviceRequests.status,
      expiresAt: serviceRequests.expiresAt,
    })
    .from(serviceQuotes)
    .innerJoin(serviceRequests, eq(serviceRequests.id, serviceQuotes.requestId))
    .where(eq(serviceQuotes.id, quoteId))
    .limit(1);

  if (!quote || (quote.providerId !== auth && quote.customerId !== auth)) {
    return { error: "Bu yazışmayı göremezsin." };
  }
  if (!chatOpen({ quoteStatus: quote.status, requestStatus: quote.requestStatus, expiresAt: quote.expiresAt })) {
    return { error: "Bu yazışma kapandı." };
  }
  if (await overLimit("serviceMessageSend", auth)) {
    return { error: "Çok hızlı mesaj gönderiyorsun. Biraz bekle." };
  }

  await db.insert(serviceMessages).values({
    quoteId,
    senderId: auth,
    body: text,
  });
  revalidatePath(`/islerim/${quote.requestId}`);
  revalidatePath(`/islerim/${quote.requestId}/teklif/${quoteId}`);
  revalidatePath(`/hizmet-veren/teklifler/${quoteId}`);
  return { ok: true };
}

export async function acceptQuote(quoteId: number): Promise<ActionError | { ok: true }> {
  const auth = await userId();
  if (typeof auth !== "string") return auth;

  const [quote] = await db
    .select({
      id: serviceQuotes.id,
      requestId: serviceQuotes.requestId,
      status: serviceQuotes.status,
      customerId: serviceRequests.customerId,
      requestStatus: serviceRequests.status,
      expiresAt: serviceRequests.expiresAt,
    })
    .from(serviceQuotes)
    .innerJoin(serviceRequests, eq(serviceRequests.id, serviceQuotes.requestId))
    .where(eq(serviceQuotes.id, quoteId))
    .limit(1);

  if (!quote || quote.customerId !== auth) return { error: "Bu teklifi kabul edemezsin." };
  if (quote.status !== "pending" || quote.requestStatus !== "open") {
    return { error: "Bu teklif artık kabul edilemez." };
  }
  if (quote.expiresAt <= new Date()) return { error: "Bu işin süresi doldu." };

  try {
    await db.transaction(async (tx) => {
    const [locked] = await tx
      .select({ status: serviceRequests.status })
      .from(serviceRequests)
      .where(eq(serviceRequests.id, quote.requestId))
      .for("update");
    if (!locked || locked.status !== "open") {
      throw new Error("REQUEST_NOT_OPEN");
    }
    await tx
      .update(serviceQuotes)
      .set({ status: "rejected" })
      .where(and(eq(serviceQuotes.requestId, quote.requestId), eq(serviceQuotes.status, "pending")));
    await tx
      .update(serviceQuotes)
      .set({ status: "accepted" })
      .where(eq(serviceQuotes.id, quoteId));
    await tx
      .update(serviceRequests)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(and(eq(serviceRequests.id, quote.requestId), eq(serviceRequests.status, "open")));
    });
  } catch {
    return { error: "Bu teklif artık kabul edilemez." };
  }

  revalidatePath("/islerim");
  revalidatePath(`/islerim/${quote.requestId}`, "layout");
  revalidatePath("/hizmet-veren/ilanlar");
  revalidatePath("/hizmet-veren/teklifler");
  await notifyProviderQuoteAccepted(quoteId);
  return { ok: true };
}

export async function closeServiceRequest(requestId: number): Promise<ActionError | { ok: true }> {
  const auth = await userId();
  if (typeof auth !== "string") return auth;

  const closed = await db.transaction(async (tx) => {
    const [request] = await tx
      .update(serviceRequests)
      .set({ status: "closed", updatedAt: new Date() })
      .where(
        and(
          eq(serviceRequests.id, requestId),
          eq(serviceRequests.customerId, auth),
          inArray(serviceRequests.status, ["pending", "open"]),
        ),
      )
      .returning({ id: serviceRequests.id });
    if (!request) return false;
    await tx
      .update(serviceQuotes)
      .set({ status: "rejected" })
      .where(and(eq(serviceQuotes.requestId, requestId), eq(serviceQuotes.status, "pending")));
    return true;
  });
  if (!closed) return { error: "Bu ilan kapatılamaz." };

  revalidatePath("/islerim");
  revalidatePath(`/islerim/${requestId}`, "layout");
  revalidatePath("/hizmet-veren/ilanlar");
  revalidatePath("/hizmet-veren/teklifler");
  revalidatePath("/admin/hizmet-ilanlari");
  return { ok: true };
}

export async function createReview(input: {
  quoteId: number;
  stars: number;
  body: string;
}): Promise<ActionError | { ok: true }> {
  const auth = await userId();
  if (typeof auth !== "string") return auth;
  const stars = Math.round(Number(input.stars));
  if (stars < 1 || stars > 5) return { error: "1 ile 5 arasında bir yıldız seç." };
  const body = input.body.trim();
  if (body.length > 1000) return { error: "Yorum çok uzun." };

  const [quote] = await db
    .select({
      id: serviceQuotes.id,
      requestId: serviceQuotes.requestId,
      providerId: serviceQuotes.providerId,
      status: serviceQuotes.status,
      customerId: serviceRequests.customerId,
    })
    .from(serviceQuotes)
    .innerJoin(serviceRequests, eq(serviceRequests.id, serviceQuotes.requestId))
    .where(eq(serviceQuotes.id, input.quoteId))
    .limit(1);

  if (!quote || quote.customerId !== auth || quote.status !== "accepted") {
    return { error: "Yorum, kabul ettiğin teklif için bırakılır." };
  }

  try {
    await db.insert(serviceReviews).values({
      quoteId: quote.id,
      requestId: quote.requestId,
      customerId: auth,
      providerId: quote.providerId,
      stars,
      body,
    });
  } catch {
    return { error: "Bu teklif için zaten yorum bıraktın." };
  }

  revalidatePath(`/islerim/${quote.requestId}`, "layout");
  revalidatePath("/ayarlar/yorumlar");
  return { ok: true };
}
