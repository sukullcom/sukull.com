import { cache } from "react";
import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { users } from "@/db/schema";

import { getServerUser } from "./auth";

/**
 * Admin role resolution.
 *
 * ## Why React `cache()`?
 *
 * `isAdmin()` is called from admin layouts, route handlers and multiple
 * server actions within a single request. Without memoisation we'd hit
 * `users` with one SELECT per caller; on the admin dashboard that's 4–6
 * round-trips per navigation. `cache()` dedupes the fetch for the lifetime
 * of one request (React 19 / Next 15 semantics).
 *
 * ## Why the read is now side-effect-free
 *
 * The previous implementation performed a `users.role = 'admin'` UPDATE
 * *inside the read* when the caller's email matched `ADMIN_EMAILS` but the
 * row had a non-admin role. That turned every anonymous-ish admin page
 * view into a write, and — more importantly — made `isAdmin()` an
 * unobservable mutation point. If `ADMIN_EMAILS` ever leaked, a single
 * visit to any admin-gated route would permanently escalate that user's
 * DB role.
 *
 * We now split the concerns:
 *   - `isAdmin()` — cached, pure read of `users.role`.
 *   - `syncAdminRoleFromEmail()` — explicit write. Called exactly once
 *     per successful auth callback (see `app/api/auth/callback/route.ts`)
 *     *and* exposed as a manual button for admins to refresh after an
 *     `ADMIN_EMAILS` env-var change.
 */

const adminEmails = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase())
  : [];

/**
 * Returns `true` when the current user has `role = 'admin'` in the
 * database, `false` for any other value, and `null` when nobody is signed
 * in. React-cached so repeated callers within the same request share one
 * DB round-trip.
 *
 * This is a pure read: it does **not** promote or demote; for that use
 * `syncAdminRoleFromEmail()` at an explicit sync point.
 */
export const isAdmin = cache(async (): Promise<boolean | null> => {
  const user = await getServerUser();
  if (!user) return null;

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });

  return userRecord?.role === "admin";
});

/**
 * Returns the current user iff they are an admin. Mirrors `isAdmin()` but
 * exposes id/email so callers (e.g. audit logging) can attribute actions
 * without an extra Supabase round-trip. Also React-cached per request.
 */
export const getAdminActor = cache(
  async (): Promise<{ id: string; email: string | null } | null> => {
    const admin = await isAdmin();
    if (!admin) return null;

    const user = await getServerUser();
    if (!user) return null;

    return { id: user.id, email: user.email ?? null };
  },
);

/**
 * Idempotent role reconciliation against the `ADMIN_EMAILS` env var.
 *
 * Called at:
 *   - auth callback (once per login / email verification)
 *   - `/admin/sync` (manual refresh button for env changes)
 *
 * **Never** called from a read-path. Returns whether an UPDATE was issued.
 *
 * Pass the Supabase auth user explicitly to avoid a second `getServerUser()`
 * round-trip at callback time, where we already have it in scope.
 */
export async function syncAdminRoleFromEmail(authUser: {
  id: string;
  email: string | null | undefined;
}): Promise<boolean> {
  if (!authUser?.email) return false;

  const shouldBeAdmin = adminEmails.includes(authUser.email.toLowerCase());

  const current = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
    columns: { role: true },
  });
  if (!current) return false;

  const isCurrentlyAdmin = current.role === "admin";
  if (shouldBeAdmin === isCurrentlyAdmin) return false;

  await db
    .update(users)
    .set({
      role: shouldBeAdmin ? "admin" : "user",
      updated_at: new Date(),
    })
    .where(eq(users.id, authUser.id));

  return true;
}

/**
 * Legacy alias. Callers that previously relied on `syncAdminRole()` —
 * which pulled the current user via `getServerUser()` — keep working
 * unchanged. New code should prefer `syncAdminRoleFromEmail` and pass the
 * user explicitly.
 */
export async function syncAdminRole(): Promise<boolean> {
  const user = await getServerUser();
  if (!user) return false;
  return syncAdminRoleFromEmail({ id: user.id, email: user.email });
}
