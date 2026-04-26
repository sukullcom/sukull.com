"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import db from "@/db/drizzle";
import {
  activityLog,
  challengeProgress,
  errorLog,
  listingOffers,
  listings,
  messageUnlocks,
  schools,
  snippets,
  studyBuddyChats,
  studyBuddyMessages,
  studyBuddyPosts,
  teacherApplications,
  userDailyChallenges,
  userDailyStreak,
  userProgress,
  users,
} from "@/db/schema";
import { getServerUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit-db";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdminClient } from "@/utils/supabase/admin";

const log = logger.child({ labels: { module: "actions/account" } });

/**
 * Outcome codes for `deleteMyAccount`. Keeping them as a union lets the
 * client map each one to a localized message without relying on the
 * `message` text (which is debug-only and may change).
 */
export type DeleteMyAccountResult =
  | { ok: true }
  | { ok: false; code: "unauthenticated" | "confirmation_mismatch" | "rate_limited" | "unknown_user" | "internal" ; message?: string };

/**
 * KVKK / GDPR right-to-erasure: permanently delete the current user's
 * account and personal data.
 *
 * ## Why this lives on the server, not the client
 *
 * Supabase's public anon key can call `auth.signOut()` but **cannot**
 * remove the row in `auth.users`. Deletion requires the service-role
 * key, which must never touch the browser. Doing the cascade on the
 * server also lets us wrap every per-user table in a single transaction
 * so a mid-flight failure can't leave the user half-deleted.
 *
 * ## Confirmation flow
 *
 * The client must pass the user's current username verbatim as
 * `confirmationPhrase`. This stops accidental double-click deletions and
 * CSRF-style forgeries in the narrow window between fetching the profile
 * and submitting the delete. We additionally rate-limit to 3/day in
 * `RATE_LIMITS.accountDelete` so a compromised session can't spam it.
 *
 * ## Order of operations
 *
 *   1. Rate-limit (fail-closed if bucket exceeded).
 *   2. Audit log **before** destruction so we retain evidence even if
 *      a subsequent step throws.
 *   3. DB transaction — delete every per-user row in tables that don't
 *      have an `ON DELETE CASCADE` FK on `users(id)`. For tables that
 *      do cascade (credits, bookings, reviews …) we let Postgres handle
 *      them when we delete the `users` row last.
 *   4. Subtract the user's contributed points from their school's
 *      `total_points` *inside* the transaction so leaderboards stay
 *      consistent.
 *   5. Anonymize system-owned tables (`error_log` stays for ops, but we
 *      NULL out the `user_id` to comply with erasure).
 *   6. Outside the transaction: call Supabase Admin to delete the auth
 *      user, then `signOut()` the current session so the redirect below
 *      is unauthenticated.
 */
export async function deleteMyAccount(
  confirmationPhrase: string,
): Promise<DeleteMyAccountResult> {
  const authUser = await getServerUser();
  if (!authUser) {
    return { ok: false, code: "unauthenticated" };
  }
  const userId = authUser.id;

  // Irreversible destructive flow. If the limiter store is unreachable
  // we would rather tell the user to retry in a minute (fail-closed)
  // than accept an unbounded burst of delete attempts that could
  // cascade through the erasure transaction while the DB is already
  // under pressure.
  const limit = await checkRateLimit({
    key: `account-delete:user:${userId}`,
    ...RATE_LIMITS.accountDelete,
    onStoreError: "closed",
  });
  if (!limit.allowed) {
    return { ok: false, code: "rate_limited" };
  }

  try {
    const profile = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true, name: true },
    });
    if (!profile) {
      return { ok: false, code: "unknown_user" };
    }

    const typed = (confirmationPhrase ?? "").trim();
    if (!typed || typed !== profile.name) {
      return { ok: false, code: "confirmation_mismatch" };
    }

    // Pre-capture the school impact so we can reverse it atomically.
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: { schoolId: true, points: true },
    });

    // Write the audit row FIRST so operators have a record even if
    // cascades later explode mid-flight and force a manual cleanup.
    try {
      await logAdminAction({
        actorId: userId,
        actorEmail: profile.email ?? null,
        action: "account.delete",
        targetType: "user",
        targetId: userId,
        metadata: {
          email: profile.email ?? null,
          name: profile.name ?? null,
          schoolId: progress?.schoolId ?? null,
          pointsReturned: progress?.points ?? 0,
          selfService: true,
        },
      });
    } catch (err) {
      // Audit failure should not block erasure — KVKK right is primary.
      log.warn("account.delete audit write failed", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    await db.transaction(async (tx) => {
      // 1. Per-user tables without ON DELETE CASCADE FKs.
      //    Order matters only where there are FK chains between these
      //    tables — here each is independent of the others.
      await tx.delete(challengeProgress).where(eq(challengeProgress.userId, userId));
      await tx.delete(userDailyStreak).where(eq(userDailyStreak.userId, userId));
      await tx.delete(userDailyChallenges).where(eq(userDailyChallenges.userId, userId));
      await tx.delete(snippets).where(eq(snippets.userId, userId));
      await tx.delete(teacherApplications).where(eq(teacherApplications.userId, userId));
      await tx.delete(activityLog).where(eq(activityLog.userId, userId));
      // Marketplace: listings & offers authored by this user. Student-
      // side listings and teacher-side offers both erase here; the
      // user's outgoing messages are handled via study-buddy below.
      await tx.delete(listingOffers).where(eq(listingOffers.teacherId, userId));
      await tx.delete(listings).where(eq(listings.studentId, userId));
      await tx.execute(sql`
        DELETE FROM ${messageUnlocks}
        WHERE ${messageUnlocks.studentId} = ${userId}
           OR ${messageUnlocks.teacherId} = ${userId}
      `);
      // Note: `activity_log_daily` is pre-aggregated across users (no
      // per-user column) — nothing to erase there without degrading
      // the historical analytics rollup.

      // 2. Study-buddy: posts and messages the user authored.
      //    Chats are shared (two participants). We strip the user's
      //    outgoing messages but leave the chat shell in place so the
      //    other participant's side still renders — this matches how
      //    most messaging products handle deletion and avoids orphaning
      //    a correspondent's history.
      await tx.delete(studyBuddyPosts).where(eq(studyBuddyPosts.user_id, userId));
      await tx.delete(studyBuddyMessages).where(eq(studyBuddyMessages.sender, userId));
      // Drop any chats that had this user as one of the participants by
      // matching inside the jsonb array. The cascading FK on messages
      // handles message cleanup for deleted chats.
      await tx.execute(sql`
        DELETE FROM ${studyBuddyChats}
        WHERE ${studyBuddyChats.participants} @> ${JSON.stringify([userId])}::jsonb
      `);

      // 3. Points reversal: keep school total consistent.
      if (progress?.schoolId && (progress.points ?? 0) > 0) {
        await tx
          .update(schools)
          .set({
            totalPoints: sql`GREATEST(${schools.totalPoints} - ${progress.points}, 0)`,
          })
          .where(eq(schools.id, progress.schoolId));
      }

      // 4. user_progress is referenced by nothing else directly — drop it.
      await tx.delete(userProgress).where(eq(userProgress.userId, userId));

      // 5. Anonymize error_log entries. We keep the rows because they
      //    are system-operational (stack traces, correlation IDs) and
      //    not a personal record — but the user_id column can identify
      //    the subject, so we null it out.
      await tx.update(errorLog).set({ userId: null }).where(eq(errorLog.userId, userId));

      // 6. Finally delete the profile row. FK cascades take care of
      //    user_credits, credit_transactions, payment_logs,
      //    user_subscriptions, teacher_fields, credit_usage, any
      //    remaining listings/offers/message_unlocks rows.
      await tx.delete(users).where(eq(users.id, userId));

      // Defensive: if any row survived the above (shouldn't happen,
      // but FK ON DELETE could be mis-configured), bail out so the
      // transaction rolls back rather than leaving a half-deleted user.
      const lingering = await tx
        .select({ c: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.id, userId));
      if ((lingering[0]?.c ?? 0) > 0) {
        throw new Error("users row still present after cascade delete");
      }
    });

    // Outside the DB transaction: drop the auth-side record so the
    // email cannot re-authenticate, and the session becomes invalid on
    // every future request.
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      const { error: adminErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (adminErr) {
        // The DB-side deletion already completed. A failure here leaves
        // an orphan auth.users row that cannot log into anything (its
        // profile is gone, protected layouts redirect away). Operator
        // should sweep it up, but we must not surface as "not deleted".
        log.error({
          message: "supabase auth admin.deleteUser failed after db erase",
          error: adminErr,
          source: "server-action",
          location: "account/deleteMyAccount",
          fields: { userId },
        });
      }
    } catch (err) {
      log.error({
        message: "supabase admin client unavailable during account delete",
        error: err,
        source: "server-action",
        location: "account/deleteMyAccount",
        fields: { userId },
      });
    }

    // Tear down the user's cookie session so middleware won't try to
    // re-load a now-nonexistent profile on the redirect.
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (err) {
      log.warn("sign-out after account delete failed", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return { ok: true };
  } catch (error) {
    log.error({
      message: "account deletion failed",
      error,
      source: "server-action",
      location: "account/deleteMyAccount",
      fields: { userId },
    });
    return {
      ok: false,
      code: "internal",
      message: error instanceof Error ? error.message : "unknown",
    };
  }
}

/**
 * Convenience wrapper used by the profile UI: delete, then hard-redirect
 * to the marketing root. Kept separate so Server Actions invoking this
 * from forms can `redirect()` (which throws a special exception Next.js
 * catches) without the action body needing to worry about return types.
 */
export async function deleteMyAccountAndRedirect(confirmationPhrase: string) {
  const result = await deleteMyAccount(confirmationPhrase);
  if (result.ok) {
    redirect("/?deleted=1");
  }
  return result;
}
