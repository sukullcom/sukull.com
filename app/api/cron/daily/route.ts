import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { listings } from "@/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";
import { performDailyReset, applyDailyStreakBonuses } from "@/actions/daily-streak";
import { expireStaleInfiniteHeartsSubscriptions } from "@/actions/subscription-cleanup";
import { updateTotalPointsForSchools } from "@/actions/user-progress";
import { reconcilePaymentsCronStep } from "@/actions/payment-reconciliation";
import { getRequestLogger } from "@/lib/logger";
import { verifyCronAuth } from "@/lib/cron-auth";

export const maxDuration = 60; // Vercel Hobby limit is 60s

type StepResult = {
  name: string;
  success: boolean;
  durationMs: number;
  details?: unknown;
  error?: string;
};

/** Postgres JSON may arrive as string depending on driver. */
function normalizePgJsonSummary(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return { unparsed: raw };
    }
  }
  return raw;
}

async function runStep(name: string, fn: () => Promise<unknown>): Promise<StepResult> {
  const start = Date.now();
  try {
    const details = await fn();
    return {
      name,
      success: true,
      durationMs: Date.now() - start,
      details,
    };
  } catch (error) {
    const log = await getRequestLogger({ labels: { module: "cron", job: "daily", step: name } });
    log.error({
      message: `cron/daily step "${name}" failed`,
      error,
      source: "cron",
      location: `cron/daily/${name}`,
      fields: { durationMs: Date.now() - start },
    });
    return {
      name,
      success: false,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Marketplace housekeeping. A listing quietly expires after
 * `LISTING_TTL_DAYS` of inactivity so the teacher feed stays fresh —
 * students can always re-post. No bidders / students are charged for
 * expiring; it's purely a status flip.
 */
const LISTING_TTL_DAYS = 30;

async function expireStaleListings() {
  const cutoff = new Date(Date.now() - LISTING_TTL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  const expired = await db
    .update(listings)
    .set({ status: "expired", updatedAt: now })
    .where(
      and(
        eq(listings.status, "open"),
        lt(listings.createdAt, cutoff),
      ),
    )
    .returning({ id: listings.id });

  return { expiredCount: expired.length };
}

async function runDaily(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) {
    if (auth.reason === "missing_secret" && process.env.NODE_ENV === "production") {
      console.warn(
        "[cron/daily] CRON_SECRET tanımlı değil — Vercel Cron başlığı olmadan tetiklenemez.",
      );
    }
    return NextResponse.json(
      { success: false, error: "Bu işlem için yetkiniz yok." },
      { status: 401 },
    );
  }

  const overallStart = Date.now();
  const steps: StepResult[] = [];

  steps.push(
    await runStep("reset-streaks", async () => {
      const result = await performDailyReset();
      if (result.success) {
        try {
          await applyDailyStreakBonuses();
        } catch (bonusError) {
          const log = await getRequestLogger({ labels: { module: "cron", job: "daily", step: "streak-bonuses" } });
          log.error({
            message: "streak bonuses application failed",
            error: bonusError,
            source: "cron",
            location: "cron/daily/streak-bonuses",
          });
        }
      }
      return result;
    }),
  );

  steps.push(
    await runStep("update-school-points", async () => {
      const ok = await updateTotalPointsForSchools();
      return { success: ok };
    }),
  );

  steps.push(await runStep("expire-stale-listings", expireStaleListings));

  steps.push(
    await runStep("expire-infinite-hearts-subscriptions", () =>
      expireStaleInfiniteHeartsSubscriptions(),
    ),
  );

  steps.push(
    await runStep("cleanup-rate-limits", async () => {
      /** Purges expired rows; active windows still enforced in `check_rate_limit`. */
      const result = await db.execute(sql`SELECT cleanup_rate_limits() AS deleted`);
      const row =
        (result as unknown as { rows?: Array<Record<string, unknown>> }).rows?.[0] ??
        (result as unknown as Array<Record<string, unknown>>)[0];
      return { deleted: Number(row?.deleted ?? 0) };
    }),
  );

  steps.push(
    await runStep("cleanup-activity-log", async () => {
      const result = await db.execute(sql`SELECT cleanup_activity_log(90) AS summary`);
      const row =
        (result as unknown as { rows?: Array<Record<string, unknown>> }).rows?.[0] ??
        (result as unknown as Array<Record<string, unknown>>)[0];
      return normalizePgJsonSummary(row?.summary ?? row ?? null);
    }),
  );

  steps.push(
    await runStep("cleanup-error-log", async () => {
      const result = await db.execute(sql`SELECT cleanup_error_log(30) AS deleted`);
      const row =
        (result as unknown as { rows?: Array<Record<string, unknown>> }).rows?.[0] ??
        (result as unknown as Array<Record<string, unknown>>)[0];
      return { deleted: Number(row?.deleted ?? 0) };
    }),
  );

  steps.push(
    await runStep("cleanup-admin-audit", async () => {
      const result = await db.execute(sql`SELECT cleanup_admin_audit(365) AS deleted`);
      const row =
        (result as unknown as { rows?: Array<Record<string, unknown>> }).rows?.[0] ??
        (result as unknown as Array<Record<string, unknown>>)[0];
      return { deleted: Number(row?.deleted ?? 0) };
    }),
  );

  steps.push(
    await runStep("reconcile-payments", async () => {
      // Iyzico'da başarılı ama bizde hizmet açılmamış orphan ödemeleri bul.
      // Detay için: `actions/payment-reconciliation.ts`. Bu adım otomatik
      // refund veya kredi yazımı yapmaz — sadece operatöre alarm. Manuel
      // reconcile süreci için admin panelinden listelenebilir.
      return await reconcilePaymentsCronStep();
    }),
  );

  steps.push(
    await runStep("expire-stale-payment-attempts", async () => {
      // Yarım kalmış ödeme satırlarını failed işaretle. İki durum:
      //   • `pending_3ds`: kullanıcı OTP'yi bitirmedi (sekme kapandı, banka
      //     çağrısı asıldı). 30 dk TTL.
      //   • `processing`: reservation atıldı ama Iyzico çağrısı/cevabı
      //     yarıda kesildi (server crash, lambda timeout). 10 dk TTL — bu
      //     pencere normal Iyzico round-trip + DB commit için 10x bol.
      // Aksi halde kullanıcı aynı idempotencyKey ile tekrar denerken sonsuza
      // dek 409 görür ya da `findIdempotentResult` yanıltıcı yanıt verir.
      const result = await db.execute<{ user_id: string; payment_id: string; prior_status: string }>(sql`
        UPDATE payment_logs
           SET status = 'failed',
               error_code = COALESCE(
                 error_code,
                 CASE status
                   WHEN 'pending_3ds' THEN 'pending_3ds_expired'
                   WHEN 'processing'  THEN 'processing_expired'
                   ELSE 'expired'
                 END
               ),
               error_message = COALESCE(error_message, 'İşlem süresinde tamamlanmadı')
         WHERE (
                 (status = 'pending_3ds' AND created_at < NOW() - INTERVAL '30 minutes')
              OR (status = 'processing'  AND created_at < NOW() - INTERVAL '10 minutes')
               )
         RETURNING user_id, payment_id, status AS prior_status
      `);
      const rows =
        (result as unknown as { rows?: Array<{ user_id: string; payment_id: string; prior_status: string }> }).rows ??
        (Array.isArray(result)
          ? (result as unknown as Array<{ user_id: string; payment_id: string; prior_status: string }>)
          : []);
      return { expired: rows.length };
    }),
  );

  const overallDurationMs = Date.now() - overallStart;
  const allOk = steps.every((s) => s.success);

  const summaryLog = await getRequestLogger({
    labels: { module: "cron", job: "daily", op: "summary" },
  });
  for (const s of steps) {
    if (s.success && s.name.startsWith("cleanup-")) {
      summaryLog.info("cron/daily cleanup step completed", {
        source: "cron",
        location: `cron/daily/${s.name}`,
        step: s.name,
        durationMs: s.durationMs,
        details: s.details,
      });
    }
  }

  return NextResponse.json(
    {
      success: allOk,
      timestamp: new Date().toISOString(),
      durationMs: overallDurationMs,
      steps,
    },
    { status: allOk ? 200 : 500 },
  );
}

export async function GET(request: NextRequest) {
  return runDaily(request);
}

export async function POST(request: NextRequest) {
  return runDaily(request);
}
