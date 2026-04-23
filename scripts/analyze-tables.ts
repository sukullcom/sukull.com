/**
 * Run ANALYZE on tables touched by recent index migrations so the query
 * planner has up-to-date statistics for the new indexes.
 *
 * Usage:
 *   npm run db:analyze
 *
 * This is a no-op on tables that have never changed since the last ANALYZE,
 * but it's cheap and idempotent. Run it once after applying a migration
 * that adds new indexes.
 */
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env" });

const TABLES = [
  "teacher_applications",
  "private_lesson_applications",
  "schools",
  "lesson_bookings",
  "lesson_reviews",
  "user_progress",
] as const;

async function main(): Promise<void> {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("DIRECT_URL or DATABASE_URL must be set in .env");
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  for (const table of TABLES) {
    const started = Date.now();
    try {
      await client.query(`ANALYZE "${table}"`);
      console.log(`  ANALYZE ${table}  (${Date.now() - started}ms)`);
    } catch (err) {
      console.error(`  ANALYZE ${table} FAILED:`, err);
      process.exitCode = 1;
    }
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
