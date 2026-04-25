import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { listings } from "@/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";
import { performDailyReset, applyDailyStreakBonuses } from "@/actions/daily-streak";
import { updateTotalPointsForSchools } from "@/actions/user-progress";
import { getRequestLogger } from "@/lib/logger";

export const maxDuration = 60; // Vercel Hobby limit is 60s

type StepResult = {
  name: string;
  success: boolean;
  durationMs: number;
  details?: unknown;
  error?: string;
};

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
  const authHeader = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const hasValidSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !hasValidSecret) {
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
    await runStep("cleanup-rate-limits", async () => {
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
      return row?.summary ?? row ?? null;
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

  const overallDurationMs = Date.now() - overallStart;
  const allOk = steps.every((s) => s.success);

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
