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
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env" });

async function main(): Promise<void> {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error(
      "Usage: npx tsx scripts/apply-migration.ts <path-to-sql-file>",
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

  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "[apply-migration] DIRECT_URL or DATABASE_URL must be set in .env",
    );
    process.exit(1);
  }

  const using = process.env.DIRECT_URL ? "DIRECT_URL" : "DATABASE_URL";
  const client = new Client({
    connectionString: url,
    ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });

  const startedAt = Date.now();
  console.log(`[apply-migration] connecting via ${using} ...`);
  await client.connect();

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
