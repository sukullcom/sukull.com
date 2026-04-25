/**
 * GET    /api/private-lesson/listings/[id]
 *   Any authenticated user can read a single listing. For the owner we
 *   include offers (teacher bids) so the student can accept/reject.
 *
 * PATCH  /api/private-lesson/listings/[id]
 *   Owner-only: close the listing. (Full field edit is intentionally
 *   not exposed yet — price haggling happens via offers, so editing a
 *   live listing mid-flight would confuse teachers who already paid a
 *   credit to bid.)
 *
 * DELETE /api/private-lesson/listings/[id]
 *   Owner-only, soft-close. We keep the row for audit/credit history.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import {
  closeListing,
  getListingById,
  getListingWithOffers,
} from "@/db/queries";

type RouteContext = { params: { id: string } };

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 },
      );
    }

    const id = Number.parseInt(params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Geçersiz ilan" }, { status: 400 });
    }

    const listing = await getListingById(id);
    if (!listing) {
      return NextResponse.json(
        { error: "İlan bulunamadı" },
        { status: 404 },
      );
    }

    // Owner gets the listing + all offers (so they can accept/reject).
    if (listing.studentId === user.id) {
      const full = await getListingWithOffers(id);
      return NextResponse.json({ listing: full });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    const log = await getRequestLogger({
      labels: { route: "api/private-lesson/listings/[id]", op: "read" },
    });
    log.error({
      message: "read listing failed",
      error,
      location: "api/private-lesson/listings/[id]/GET",
    });
    return NextResponse.json({ error: "İlan alınamadı" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  return mutate(request, params, "patch");
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
) {
  return mutate(request, params, "delete");
}

async function mutate(
  request: NextRequest,
  params: { id: string },
  op: "patch" | "delete",
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 },
      );
    }

    const id = Number.parseInt(params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Geçersiz ilan" }, { status: 400 });
    }

    const rl = await checkRateLimit({
      key: `listingWrite:user:${user.id}`,
      ...RATE_LIMITS.listingWrite,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek. Biraz sonra tekrar deneyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    if (op === "patch") {
      const body = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (body.action === "close" || body.status === "closed") {
        const row = await closeListing(id, user.id);
        if (!row) {
          return NextResponse.json(
            { error: "İlan bulunamadı ya da yetkiniz yok" },
            { status: 404 },
          );
        }
        return NextResponse.json({ listing: row });
      }
      return NextResponse.json(
        { error: "Desteklenmeyen işlem" },
        { status: 400 },
      );
    }

    const row = await closeListing(id, user.id);
    if (!row) {
      return NextResponse.json(
        { error: "İlan bulunamadı ya da yetkiniz yok" },
        { status: 404 },
      );
    }
    return NextResponse.json({ listing: row });
  } catch (error) {
    const log = await getRequestLogger({
      labels: { route: "api/private-lesson/listings/[id]", op },
    });
    log.error({
      message: "mutate listing failed",
      error,
      location: `api/private-lesson/listings/[id]/${op.toUpperCase()}`,
    });
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
