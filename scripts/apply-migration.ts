/**
 * Apply a single raw-SQL migration file against the project database.
 *
 * Usage:
 *   npm run db:apply -- supabase/migrations/0025_add_admin_search_and_leaderboard_indexes.sql
 *
 * Or directly:
 *   npx tsx scripts/apply-migration.ts <path-to-sql>
 *
 * Why this exists:
 *   Hand-written performance/index migrations (0003, 0018, 0025, ...) are not
 *   tracked in Drizzle's journal and are not picked up by `drizzle-kit push`.
 *   Each SQL file is designed to be idempotent (IF NOT EXISTS / IF EXISTS)
 *   so re-running is safe.
 *
 * Connection:
 *   Uses DIRECT_URL when available (port 5432, direct PG connection) and
 *   falls back to DATABASE_URL. DDL statements like CREATE INDEX can fail
 *   on the Supabase transaction pooler (port 6543) so DIRECT_URL is
 *   strongly preferred.
 *
 * Env files:
 *   Loads `.env` then `.env.local` (local wins), matching Next.js.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env" });
config({ path: ".env.local", override: true });

function isUnreachableDbHost(code?: string): boolean {
  return (
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ENETUNREACH" ||
    code === "EHOSTUNREACH"
  );
}

/** Shared pooler session mode (IPv4, port 5432) — usable for CREATE INDEX. */
function sessionPoolerUrl(databaseUrl?: string): string | null {
  const raw = databaseUrl?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!parsed.hostname.includes("pooler.supabase.com")) return null;
    parsed.port = "5432";
    return parsed.toString();
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error(
      "Usage: npx tsx scripts/apply-migration.ts <path-to-sql-file>\n\n" +
        "Examples (from repo root):\n" +
        "  npm run db:apply -- supabase/migrations/0025_add_admin_search_and_leaderboard_indexes.sql\n" +
        "  npm run db:apply -- supabase/migrations/0035_schools_city_district_category.sql\n" +
        "  npm run db:apply -- supabase/migrations/0036_schools_indexes_repair.sql\n" +
        "  npm run db:apply -- supabase/migrations/0037_study_buddy_chats_unique_two_user_pair.sql\n" +
        "  npm run db:apply -- supabase/migrations/0038_rls_study_buddy_schools_users.sql\n" +
        "  npm run db:apply -- supabase/migrations/0040_final_rls_all_tables.sql\n" +
        "  npm run db:apply -- supabase/migrations/0041_rls_marketplace_credits_snippets_daily.sql\n" +
        "  npm run db:apply -- supabase/migrations/0042_user_referrals.sql\n" +
        "  npm run db:apply -- supabase/migrations/0043_payment_logs_user_payment_id_unique.sql\n" +
        "  (0036–0038: indeks/chat/RLS temeli; 0040: içerik + ilerleme + başvuru + log RLS; 0041: marketplace; 0042: davet kodu + referral_rewards; 0043: payment_logs idempotency index.)\n\n" +
        "Requires DIRECT_URL (preferred for DDL) or DATABASE_URL in .env or .env.local.",
    );
    process.exit(1);
  }

  const absolute = resolve(filePath);
  let sql: string;
  try {
    sql = readFileSync(absolute, "utf8");
  } catch (err) {
    console.error(`[apply-migration] cannot read ${absolute}:`, err);
    process.exit(1);
  }

  const url = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();
  const looksPlaceholder =
    !url ||
    url.includes("xxxx") ||
    url.includes("...") ||
    url.includes("example.com");
  if (looksPlaceholder) {
    console.error(
      "[apply-migration] DIRECT_URL or DATABASE_URL must be a real connection string in .env or .env.local.\n" +
        "Copy it from Supabase → Project Settings → Database → Connection string (URI).\n" +
        "Prefer the direct host on port 5432 for DIRECT_URL (not the :6543 pooler).",
    );
    process.exit(1);
  }

  const ssl = url.includes("supabase") ? { rejectUnauthorized: false } : undefined;
  let connectionString = url;
  let label = process.env.DIRECT_URL ? "DIRECT_URL" : "DATABASE_URL";

  const startedAt = Date.now();
  console.log(`[apply-migration] connecting via ${label} ...`);
  let client = new Client({ connectionString, ssl });
  try {
    await client.connect();
  } catch (err) {
    await client.end().catch(() => {});
    const code = (err as NodeJS.ErrnoException)?.code;
    const fallback = sessionPoolerUrl(process.env.DATABASE_URL);
    const isDirectHost = /db\.[a-z0-9]+\.supabase\.co/i.test(url);
    if (!fallback || fallback === url || !isDirectHost || !isUnreachableDbHost(code)) {
      throw err;
    }
    console.warn(
      "[apply-migration] DIRECT_URL host did not resolve (typical on IPv4-only networks). Retrying via pooler session mode (:5432).",
    );
    connectionString = fallback;
    label = "DATABASE_URL (session pooler :5432)";
    client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    console.log(`[apply-migration] connecting via ${label} ...`);
    await client.connect();
  }

  console.log(`[apply-migration] running ${filePath} ...`);
  try {
    await client.query(sql);
    const elapsed = Date.now() - startedAt;
    console.log(`[apply-migration] OK (${elapsed}ms)`);
  } catch (err) {
    console.error("[apply-migration] FAILED:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
