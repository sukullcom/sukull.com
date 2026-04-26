/**
 * PATCH /api/private-lesson/offers/[id]
 *   Update the status of a single offer.
 *
 *   - action=withdraw   : teacher pulls their own offer.
 *   - action=accept     : student accepts an offer on their listing.
 *     (This also closes the listing and rejects other pending offers.)
 *   - action=reject     : student rejects a single offer.
 *
 *   Credit is NOT refunded on withdraw/reject — the charge pays for
 *   access to the student's contact info, which the teacher already
 *   received at offer time. (Intentional: users/teachers/policy page
 *   surfaces this rule.)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import { acceptOffer, rejectOffer, withdrawOffer } from "@/db/queries";

type RouteContext = { params: { id: string } };

export async function PATCH(
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

    const offerId = Number.parseInt(params.id, 10);
    if (!Number.isFinite(offerId) || offerId <= 0) {
      return NextResponse.json({ error: "Geçersiz teklif" }, { status: 400 });
    }

    // Credit-state mutating write (accept closes listing and rejects
    // rivals; withdraw/reject don't refund but do flip status). We
    // fail-closed on limiter outage to avoid an unbounded accept/reject
    // storm while the DB is already struggling.
    const rl = await checkRateLimit({
      key: `listingWrite:user:${user.id}`,
      ...RATE_LIMITS.listingWrite,
      onStoreError: "closed",
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek. Biraz sonra tekrar deneyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const action = typeof body.action === "string" ? body.action : "";

    switch (action) {
      case "withdraw": {
        const row = await withdrawOffer(offerId, user.id);
        if (!row) {
          return NextResponse.json(
            { error: "Teklif bulunamadı ya da yetkiniz yok" },
            { status: 404 },
          );
        }
        return NextResponse.json({ offer: row });
      }
      case "accept": {
        const row = await acceptOffer(offerId, user.id);
        if (!row) {
          return NextResponse.json(
            { error: "Teklif bulunamadı ya da yetkiniz yok" },
            { status: 404 },
          );
        }
        return NextResponse.json({ offer: row });
      }
      case "reject": {
        const row = await rejectOffer(offerId, user.id);
        if (!row) {
          return NextResponse.json(
            { error: "Teklif bulunamadı ya da yetkiniz yok" },
            { status: 404 },
          );
        }
        return NextResponse.json({ offer: row });
      }
      default:
        return NextResponse.json(
          { error: "Desteklenmeyen işlem" },
          { status: 400 },
        );
    }
  } catch (error) {
    const log = await getRequestLogger({
      labels: {
        route: "api/private-lesson/offers/[id]",
        op: "mutate",
      },
    });
    log.error({
      message: "mutate offer failed",
      error,
      location: "api/private-lesson/offers/[id]/PATCH",
    });
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
