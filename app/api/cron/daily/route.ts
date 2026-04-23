import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { lessonBookings } from "@/db/schema";
import { eq, lt, and, isNotNull, isNull, sql } from "drizzle-orm";
import { LESSON_CONFIG } from "@/lib/lesson-config";
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

async function updateLessonStatuses() {
  const now = new Date();
  let totalUpdated = 0;
  const actions: Array<{ action: string; count: number }> = [];

  const confirmed = await db
    .update(lessonBookings)
    .set({ status: "confirmed", updatedAt: now })
    .where(and(eq(lessonBookings.status, "pending"), lt(lessonBookings.startTime, now)))
    .returning({ id: lessonBookings.id });
  if (confirmed.length) {
    totalUpdated += confirmed.length;
    actions.push({ action: "confirmed", count: confirmed.length });
  }

  const completedPaid = await db
    .update(lessonBookings)
    .set({
      status: "completed",
      completedAt: now,
      earningsAmount: LESSON_CONFIG.TEACHER_EARNINGS_PER_LESSON,
      updatedAt: now,
    })
    .where(and(
      eq(lessonBookings.status, "confirmed"),
      lt(lessonBookings.endTime, now),
      isNotNull(lessonBookings.teacherJoinedAt),
    ))
    .returning({ id: lessonBookings.id });
  if (completedPaid.length) {
    totalUpdated += completedPaid.length;
    actions.push({ action: "completed_with_earnings", count: completedPaid.length });
  }

  const completedUnpaid = await db
    .update(lessonBookings)
    .set({
      status: "completed",
      completedAt: now,
      earningsAmount: 0,
      updatedAt: now,
    })
    .where(and(
      eq(lessonBookings.status, "confirmed"),
      lt(lessonBookings.endTime, now),
      isNull(lessonBookings.teacherJoinedAt),
    ))
    .returning({ id: lessonBookings.id });
  if (completedUnpaid.length) {
    totalUpdated += completedUnpaid.length;
    actions.push({ action: "completed_no_earnings", count: completedUnpaid.length });
  }

  return { totalUpdated, actions };
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

  steps.push(await runStep("update-lesson-statuses", updateLessonStatuses));

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
