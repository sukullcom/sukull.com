/**
 * Admin → kullanıcı kredi yönetimi.
 *
 *  GET  /api/admin/credits?q=<arama>&limit=<n>
 *    Ad ve e-postada ILIKE araması; her kullanıcının mevcut bakiyesi ve
 *    son ayarlamasıyla birlikte döner. Pagination yerine basit `limit` —
 *    arama daraltıcı (>=2 karakter) zorunlu.
 *
 *  POST /api/admin/credits
 *    Body: { userId: string, delta: number, reason: string }
 *    - `delta` 0 olamaz; |delta| <= 1000 (yıkıcı bir komut için sağlık
 *      tavanı). Bu sınırı aşmak gerekirse aynı admin birden çok kez
 *      uygulasın (her biri audit'a düşer).
 *    - Negatif delta için: kullanıcının available_credits >= -delta
 *      olmalı (aksi halde balance negatife düşmez — RACE-SAFE).
 *    - Yeni kullanıcı için (user_credits satırı yoksa) sadece pozitif
 *      delta kabul edilir; INSERT açılır.
 *    - Aynı işlem hem `credit_adjustments` ledger'ına hem `admin_audit`
 *      tablosuna yazılır.
 *
 * Güvenlik tabakaları:
 *   - Auth + `isAdmin()` (DB role + env e-posta listesi)
 *   - Same-origin + CSRF (double submit)
 *   - Per-admin rate limit (`adminCreditsGrant`, `adminCreditsSearch`)
 *   - Atomik UPDATE … WHERE … RETURNING ile balance negatife düşmez
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, ilike, or, sql } from "drizzle-orm";

import db from "@/db/drizzle";
import {
  creditAdjustments,
  userCredits,
  users,
} from "@/db/schema";
import { getAdminActor } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";
import { verifyCsrf } from "@/lib/csrf";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import { isTrustedApiOrigin } from "@/lib/same-origin-api";

type SearchResult = {
  id: string;
  name: string | null;
  email: string | null;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
};

const MAX_DELTA = 1000;
const MAX_REASON_LENGTH = 200;
const MIN_REASON_LENGTH = 3;
const MAX_SEARCH_RESULTS = 20;
const MIN_QUERY_LENGTH = 2;

export async function GET(request: NextRequest) {
  const log = await getRequestLogger({
    labels: { route: "api/admin/credits", op: "search" },
  });

  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 401 },
      );
    }

    const rl = await checkRateLimit({
      key: `adminCreditsSearch:user:${actor.id}`,
      ...RATE_LIMITS.adminCreditsSearch,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < MIN_QUERY_LENGTH) {
      const empty: SearchResult[] = [];
      return NextResponse.json({ users: empty });
    }

    const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        totalCredits: userCredits.totalCredits,
        usedCredits: userCredits.usedCredits,
        availableCredits: userCredits.availableCredits,
      })
      .from(users)
      .leftJoin(userCredits, eq(userCredits.userId, users.id))
      .where(or(ilike(users.name, like), ilike(users.email, like)))
      .orderBy(users.name)
      .limit(MAX_SEARCH_RESULTS);

    const results: SearchResult[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      totalCredits: r.totalCredits ?? 0,
      usedCredits: r.usedCredits ?? 0,
      availableCredits: r.availableCredits ?? 0,
    }));

    return NextResponse.json({ users: results });
  } catch (error) {
    log.error({
      message: "admin credits search failed",
      error,
      location: "api/admin/credits/GET",
    });
    return NextResponse.json(
      { error: "Arama başarısız." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const log = await getRequestLogger({
    labels: { route: "api/admin/credits", op: "grant" },
  });

  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 401 },
      );
    }

    if (!isTrustedApiOrigin(request) || !verifyCsrf(request)) {
      return NextResponse.json(
        { error: "Geçersiz istek veya güvenlik doğrulaması başarısız." },
        { status: 403 },
      );
    }

    const rl = await checkRateLimit({
      key: `adminCreditsGrant:user:${actor.id}`,
      ...RATE_LIMITS.adminCreditsGrant,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const targetUserId =
      typeof body.userId === "string" ? body.userId.trim() : "";
    const deltaRaw = body.delta;
    const reasonRaw = typeof body.reason === "string" ? body.reason.trim() : "";

    const delta = Number(deltaRaw);
    if (
      !targetUserId ||
      !Number.isInteger(delta) ||
      delta === 0 ||
      Math.abs(delta) > MAX_DELTA
    ) {
      return NextResponse.json(
        {
          error: `Geçersiz miktar. Sıfır olmayan, mutlak değeri en fazla ${MAX_DELTA} bir tamsayı girin.`,
        },
        { status: 400 },
      );
    }
    if (
      reasonRaw.length < MIN_REASON_LENGTH ||
      reasonRaw.length > MAX_REASON_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Sebep ${MIN_REASON_LENGTH}–${MAX_REASON_LENGTH} karakter olmalı.`,
        },
        { status: 400 },
      );
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
      columns: { id: true, name: true, email: true },
    });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    // İşlem akışı:
    //   1. Var olan satırı kilitle (FOR UPDATE) → race-safe okuma.
    //   2. Bakiye negatife düşmesin → erken 400.
    //   3. Yoksa INSERT (yalnız pozitif delta), varsa UPDATE.
    //   4. credit_adjustments'a satır yaz.
    // Hepsi tek bir transaction içinde — yarış / yarım kalma olamaz.
    const grantResult = await db.transaction(async (tx) => {
      const existing = await tx.execute(sql`
        SELECT total_credits AS "totalCredits",
               used_credits  AS "usedCredits",
               available_credits AS "availableCredits"
        FROM user_credits
        WHERE user_id = ${targetUserId}
        FOR UPDATE
      `);

      type CreditsRow = {
        totalCredits: number;
        usedCredits: number;
        availableCredits: number;
      };
      const row = (existing.rows[0] ?? null) as CreditsRow | null;
      const currentAvailable = row?.availableCredits ?? 0;
      const newAvailable = currentAvailable + delta;

      if (!row && delta < 0) {
        return { ok: false, code: "no_balance_to_revoke" as const };
      }
      if (newAvailable < 0) {
        return {
          ok: false,
          code: "insufficient_balance" as const,
          currentAvailable,
        };
      }

      if (row) {
        await tx
          .update(userCredits)
          .set({
            totalCredits: sql`${userCredits.totalCredits} + ${delta}`,
            availableCredits: sql`${userCredits.availableCredits} + ${delta}`,
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, targetUserId));
      } else {
        await tx.insert(userCredits).values({
          userId: targetUserId,
          totalCredits: delta,
          usedCredits: 0,
          availableCredits: delta,
        });
      }

      await tx.insert(creditAdjustments).values({
        userId: targetUserId,
        adminId: actor.id,
        adminEmail: actor.email,
        delta,
        reason: reasonRaw,
        balanceAfter: newAvailable,
      });

      return {
        ok: true as const,
        previousAvailable: currentAvailable,
        newAvailable,
      };
    });

    if (!grantResult.ok) {
      if (grantResult.code === "no_balance_to_revoke") {
        return NextResponse.json(
          {
            error:
              "Bu kullanıcının hiç kredisi yok; negatif değer atayamazsınız.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          error: `Yetersiz bakiye: kullanıcının ${grantResult.currentAvailable} kullanılabilir kredisi var.`,
        },
        { status: 400 },
      );
    }

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user.credits.grant",
      targetType: "user",
      targetId: targetUserId,
      metadata: {
        delta,
        reason: reasonRaw,
        previousAvailable: grantResult.previousAvailable,
        newAvailable: grantResult.newAvailable,
      },
    });

    return NextResponse.json({
      ok: true,
      userId: targetUserId,
      previousAvailable: grantResult.previousAvailable,
      newAvailable: grantResult.newAvailable,
      delta,
    });
  } catch (error) {
    log.error({
      message: "admin credits grant failed",
      error,
      location: "api/admin/credits/POST",
    });
    return NextResponse.json(
      { error: "İşlem başarısız." },
      { status: 500 },
    );
  }
}

