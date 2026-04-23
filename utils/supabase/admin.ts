import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin (service-role) Supabase client.
 *
 * ⚠️  Server-only. The `server-only` import at the top throws at build
 *     time if this file is ever pulled into a Client Component or shared
 *     bundle. The service-role key bypasses every Row-Level-Security
 *     policy in the project — a single leak to the browser is effectively
 *     a full database takeover.
 *
 * We use the admin client exclusively for operations that *must* side-
 * step RLS and/or Supabase Auth's user-space surface, namely:
 *   • Deleting an auth user (`auth.admin.deleteUser`) during account
 *     erasure. Regular `signOut()` cannot remove the row in `auth.users`.
 *   • Future: admin dashboards that need to act on any user row.
 *
 * The client is lazily constructed so importing this module from code
 * paths that never call `getSupabaseAdminClient()` does not force a
 * network handshake or spam env-var validation at cold start.
 */

let cached: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "getSupabaseAdminClient: NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY must both be set for privileged ops.",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: {
      // Don't persist or auto-refresh. This client is server-scoped and
      // never represents a user session.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return cached;
}
