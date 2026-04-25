/**
 * GET  /api/private-lesson/listings/[id]/offers
 *   - Student owner:  returns all offers on the listing.
 *   - Teacher viewer: returns only their own offer (if any), plus the
 *     total count + cap, so the browse UI can show "3/4 teklif".
 *
 * POST /api/private-lesson/listings/[id]/offers
 *   Teacher submits a bid. Atomic: 1 credit is deducted and an offer
 *   row is inserted. The 4-offer cap is enforced both at the
 *   application layer and by a DB trigger (see migration 0026).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createOffer,
  getListingById,
  getOffersForListing,
  hasTeacherOfferedOnListing,
  MAX_OFFERS_PER_LISTING,
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

    if (listing.studentId === user.id) {
      const offers = await getOffersForListing(id);
      return NextResponse.json({
        offers,
        offerCount: listing.offerCount,
        maxOffers: MAX_OFFERS_PER_LISTING,
      });
    }

    // Teachers only see their own offer (if any).
    const mine = await getOffersForListing(id).then((rows) =>
      rows.filter((o) => o.teacherId === user.id),
    );
    return NextResponse.json({
      offers: mine,
      offerCount: listing.offerCount,
      maxOffers: MAX_OFFERS_PER_LISTING,
    });
  } catch (error) {
    const log = await getRequestLogger({
      labels: {
        route: "api/private-lesson/listings/[id]/offers",
        op: "list",
      },
    });
    log.error({
      message: "list offers failed",
      error,
      location: "api/private-lesson/listings/[id]/offers/GET",
    });
    return NextResponse.json(
      { error: "Teklifler alınamadı" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
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

    // Only teachers can submit offers.
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { role: true },
    });
    if (userRecord?.role !== "teacher") {
      return NextResponse.json(
        { error: "Teklif verebilmek için onaylı eğitmen olmanız gerekiyor" },
        { status: 403 },
      );
    }

    const rl = await checkRateLimit({
      key: `listingOffer:user:${user.id}`,
      ...RATE_LIMITS.listingOffer,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık teklif veriyorsunuz. Biraz sonra tekrar deneyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const priceProposal = Number(body.priceProposal);
    if (!Number.isFinite(priceProposal) || priceProposal <= 0) {
      return NextResponse.json(
        { error: "Geçerli bir fiyat teklifi girin" },
        { status: 400 },
      );
    }
    if (priceProposal > 100_000) {
      return NextResponse.json(
        { error: "Fiyat teklifi çok yüksek" },
        { status: 400 },
      );
    }
    const note =
      typeof body.note === "string" && body.note.trim().length > 0
        ? body.note.trim().slice(0, 500)
        : null;

    // Fast-path hint: double-submit from the same teacher bypassing the
    // UI (e.g. retry storm). The transaction will re-check this too.
    if (await hasTeacherOfferedOnListing(id, user.id)) {
      return NextResponse.json(
        { error: "Bu ilana zaten teklif verdiniz" },
        { status: 409 },
      );
    }

    const result = await createOffer({
      listingId: id,
      teacherId: user.id,
      priceProposal: Math.round(priceProposal),
      note,
    });

    if (!result.ok) {
      const [status, message] = offerErrorToHttp(result.code);
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      { offer: result.offer, chatId: result.chatId },
      { status: 201 },
    );
  } catch (error) {
    const log = await getRequestLogger({
      labels: {
        route: "api/private-lesson/listings/[id]/offers",
        op: "create",
      },
    });
    log.error({
      message: "create offer failed",
      error,
      location: "api/private-lesson/listings/[id]/offers/POST",
    });
    return NextResponse.json(
      { error: "Teklif gönderilemedi" },
      { status: 500 },
    );
  }
}

function offerErrorToHttp(
  code:
    | "listing_not_found"
    | "listing_closed"
    | "offer_cap_reached"
    | "already_offered"
    | "insufficient_credits"
    | "self_offer_forbidden"
    | "unknown",
): [number, string] {
  switch (code) {
    case "listing_not_found":
      return [404, "İlan bulunamadı"];
    case "listing_closed":
      return [409, "Bu ilan artık teklif kabul etmiyor"];
    case "offer_cap_reached":
      return [409, "Bu ilana en fazla 4 teklif verilebilir"];
    case "already_offered":
      return [409, "Bu ilana zaten teklif verdiniz"];
    case "insufficient_credits":
      return [402, "Yetersiz kredi. Kredi satın alın ve tekrar deneyin."];
    case "self_offer_forbidden":
      return [400, "Kendi ilanınıza teklif veremezsiniz"];
    default:
      return [500, "Teklif gönderilemedi"];
  }
}
