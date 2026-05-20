"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import db from "@/db/drizzle";
import { userProgress, users } from "@/db/schema";
import { purgeUserFromDatabase } from "@/lib/account-purge-db";
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
 * Rate limiting runs **after** confirmation succeeds so wrong phrases do
 * not consume the daily bucket.
 *
 * ## Order of operations
 *
 *   1. Confirm phrase matches profile display name (`user_progress.userName`,
 *      falling back to `users.name`).
 *   2. Rate-limit (fail-closed if bucket exceeded).
 *   3. Audit log **before** destruction so we retain evidence even if
 *      a subsequent step throws.
 *   4. DB transaction — delete every per-user row in tables that don't
 *      have an `ON DELETE CASCADE` FK on `users(id)`. For tables that
 *      do cascade (credits, bookings, reviews …) we let Postgres handle
 *      them when we delete the `users` row last.
 *   5. Subtract the user's contributed points from their school's
 *      `total_points` *inside* the transaction so leaderboards stay
 *      consistent.
 *   6. Anonymize system-owned tables (`error_log` stays for ops, but we
 *      NULL out the `user_id` to comply with erasure).
 *   7. Outside the transaction: call Supabase Admin to delete the auth
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

  try {
    const profile = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, email: true, name: true },
    });
    if (!profile) {
      return { ok: false, code: "unknown_user" };
    }

    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: { userName: true, schoolId: true, points: true },
    });

    const typed = (confirmationPhrase ?? "").trim();
    // Profil ayarlarında gösterilen ad — Danger Zone ile aynı kaynak.
    const expectedDisplayName = (progress?.userName ?? profile.name ?? "").trim();
    if (!typed || typed !== expectedDisplayName) {
      return { ok: false, code: "confirmation_mismatch" };
    }

    const limit = await checkRateLimit({
      // v4: yeni kota anahtarı; v3/v2 öncesi zehirli sayaçlar veya pooler hataları ayrıldı
      key: `account-delete:v4:user:${userId}`,
      ...RATE_LIMITS.accountDelete,
      // KVKK silme, kota DB’si geçici çökükken bloklanmamalı ("çok fazla deneme" tuzakları).
      // Gerçek kota aşımında `allowed: false` yine uygulanır.
      onStoreError: "open",
    });
    if (!limit.allowed) {
      return { ok: false, code: "rate_limited" };
    }

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

    await purgeUserFromDatabase(db, userId, {
      schoolId: progress?.schoolId ?? null,
      points: progress?.points ?? 0,
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
