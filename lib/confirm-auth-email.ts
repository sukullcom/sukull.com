import "server-only";

import { sql } from "drizzle-orm";

import db from "@/db/drizzle";
import { queryResultRows } from "@/lib/query-result";
import { getSupabaseAdminClient } from "@/utils/supabase/admin";

/**
 * Look up `auth.users.id` by email. Used to auto-confirm leftover
 * unverified accounts after signup confirmation was turned off.
 */
export async function findAuthUserIdByEmail(
  email: string,
): Promise<string | null> {
  const emailLower = email.trim().toLowerCase();
  if (!emailLower || !emailLower.includes("@")) return null;

  const result = await db.execute(sql`
    SELECT id::text AS id
    FROM auth.users
    WHERE lower(email) = ${emailLower}
    LIMIT 1
  `);
  const rows = queryResultRows<{ id: string }>(result);
  return rows[0]?.id ?? null;
}

export async function confirmAuthUserEmail(userId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  if (error) throw error;
}
