import "server-only";

import { headers } from "next/headers";

import db from "@/db/drizzle";
import { adminAudit } from "@/db/schema";
import { logger } from "@/lib/logger";

const log = logger.child({ labels: { module: "admin-audit" } });

/**
 * Admin audit logger.
 *
 * Writes to `admin_audit` (migration 0024). Every privileged admin action
 * should call this so we have a forensic trail for role changes, application
 * approvals, course edits, etc. Never throws — failures are swallowed so a
 * logging outage cannot block the underlying admin action.
 *
 * Retention is 365 days by default, pruned by the daily cron via
 * `cleanup_admin_audit()`.
 */

/**
 * Machine-readable action keys. Extend this union as you instrument new
 * admin surfaces; keeping them typed prevents typos in log filters.
 */
export type AdminAuditAction =
  // Teacher applications
  | "teacher_application.approve"
  | "teacher_application.reject"
  | "teacher_application.delete"
  // Student applications
  | "student_application.approve"
  | "student_application.reject"
  | "student_application.delete"
  // User/role management
  | "user.role.update"
  | "user.fix_student_roles"
  // Course builder
  | "course.create"
  | "course.update"
  | "course.delete"
  | "unit.create"
  | "unit.update"
  | "unit.delete"
  | "lesson.create"
  | "lesson.update"
  | "lesson.delete"
  | "challenge.create"
  | "challenge.update"
  | "challenge.delete"
  // Maintenance / data ops
  | "admin.migrate_teacher_fields"
  | "admin.fix_sequence_orders"
  | "admin.field_options.update"
  // Catch-all for one-off scripts; prefer a typed key when possible.
  | "admin.other";

export interface LogAdminActionOptions {
  actorId: string;
  actorEmail?: string | null;
  action: AdminAuditAction;
  targetType?: string | null;
  targetId?: string | number | null;
  metadata?: Record<string, unknown>;
  /**
   * Provide explicit request headers when available (e.g. from a Route Handler
   * Request object). When omitted we fall back to Next.js `headers()`, which
   * works inside server actions and RSC but not inside plain Node contexts.
   */
  ip?: string | null;
  userAgent?: string | null;
}

function firstHeader(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

async function resolveClientContext(opts: LogAdminActionOptions): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  if (opts.ip !== undefined || opts.userAgent !== undefined) {
    return {
      ip: opts.ip ?? null,
      userAgent: opts.userAgent ?? null,
    };
  }

  try {
    const h = await headers();
    return {
      ip:
        firstHeader(h.get("x-forwarded-for")) ??
        firstHeader(h.get("x-real-ip")) ??
        null,
      userAgent: h.get("user-agent"),
    };
  } catch {
    // headers() throws outside a request scope (e.g. cron). Silently degrade.
    return { ip: null, userAgent: null };
  }
}

export async function logAdminAction(opts: LogAdminActionOptions): Promise<void> {
  try {
    const { ip, userAgent } = await resolveClientContext(opts);
    await db.insert(adminAudit).values({
      actorId: opts.actorId,
      actorEmail: opts.actorEmail ?? null,
      action: opts.action,
      targetType: opts.targetType ?? null,
      targetId:
        opts.targetId === null || opts.targetId === undefined
          ? null
          : String(opts.targetId),
      ip,
      userAgent: userAgent ? userAgent.slice(0, 500) : null,
      metadata: opts.metadata ?? {},
    });
  } catch (err) {
    // Audit-logging failures must never cascade to the caller; the
    // privileged action itself has already completed. We still want a
    // persisted trail in `error_log` so ops can alert on audit drift.
    log.error({
      message: "failed to record admin action",
      error: err,
      source: "server-action",
      location: "admin-audit/logAdminAction",
      fields: {
        action: opts.action,
        actorId: opts.actorId,
        targetType: opts.targetType ?? null,
        targetId: opts.targetId ?? null,
      },
    });
  }
}

/**
 * Fire-and-forget variant for hot paths (API routes, bulk actions) where the
 * caller should not pay the DB round-trip latency.
 */
export function logAdminActionAsync(opts: LogAdminActionOptions): void {
  void logAdminAction(opts).catch(() => {
    // already handled inside logAdminAction
  });
}
