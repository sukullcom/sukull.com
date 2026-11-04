import { NextRequest, NextResponse } from "next/server";

import { saveInstagramComment } from "@/db/queries/instagram-comments";
import { logger } from "@/lib/logger";
import {
  parseInstagramCommentEvents,
  secretsMatch,
  verifyMetaSignature,
} from "@/lib/instagram/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = logger.child({ labels: { module: "api/instagram/webhook" } });
const MAX_BODY_BYTES = 1_000_000;

/**
 * GET /api/instagram/webhook
 *
 * Meta, Callback URL kaydedilirken bu adrese hub.mode, hub.verify_token
 * ve hub.challenge gönderir. Token eşleşirse challenge düz metin döner.
 */
export function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode") ?? req.nextUrl.searchParams.get("hub_mode");
  const token =
    req.nextUrl.searchParams.get("hub.verify_token") ??
    req.nextUrl.searchParams.get("hub_verify_token");
  const challenge =
    req.nextUrl.searchParams.get("hub.challenge") ??
    req.nextUrl.searchParams.get("hub_challenge");

  const expected = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN?.trim() ?? "";
  if (!expected) {
    log.error({
      message: "INSTAGRAM_WEBHOOK_VERIFY_TOKEN is not set",
      location: "api/instagram/webhook",
      source: "api-route",
    });
    return new NextResponse("webhook verify token is not configured", { status: 500 });
  }

  const ok =
    mode === "subscribe" &&
    Boolean(token) &&
    Boolean(challenge) &&
    /^[0-9]{1,64}$/.test(challenge ?? "") &&
    secretsMatch(token ?? "", expected);

  if (!ok || !challenge) {
    return new NextResponse("forbidden", { status: 403 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * POST /api/instagram/webhook
 *
 * Canlı yayın yorumu geldiğinde Meta imzalı JSON bırakır.
 * İmza App Secret ile doğrulanır, yorum kaydedilir, 200 dönülür.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return new NextResponse("payload too large", { status: 413 });
  }

  const appSecret = process.env.INSTAGRAM_APP_SECRET?.trim() ?? "";
  if (!appSecret) {
    log.error({
      message: "INSTAGRAM_APP_SECRET is not set",
      location: "api/instagram/webhook",
      source: "api-route",
    });
    return new NextResponse("app secret is not configured", { status: 503 });
  }

  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(raw, signature, appSecret)) {
    log.warn("instagram webhook signature rejected");
    return new NextResponse("invalid signature", { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    log.warn("instagram webhook payload was not json");
    return NextResponse.json({ received: 0 });
  }

  const events = parseInstagramCommentEvents(payload);
  try {
    for (const event of events) {
      await saveInstagramComment(event);
    }
  } catch (error) {
    log.error({
      message: "instagram webhook comment save failed",
      error,
      location: "api/instagram/webhook",
      source: "api-route",
      fields: { count: events.length },
    });
    return new NextResponse("save failed", { status: 500 });
  }

  if (events.length > 0) {
    log.info("instagram comments stored", {
      count: events.length,
      fields: events.map((event) => event.field),
      mediaIds: events.map((event) => event.mediaId),
    });
  } else {
    log.info("instagram webhook had no comment events");
  }

  return NextResponse.json({ received: events.length });
}
