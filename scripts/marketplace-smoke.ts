/**
 * Post-migration smoke test. Verifies that the marketplace schema is
 * in place and that the most common queries compile + run. Writes
 * nothing to the DB. Safe to re-run.
 */
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env" });

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("[smoke] DIRECT_URL or DATABASE_URL must be set");
    process.exit(1);
  }
  const client = new Client({
    connectionString: url,
    ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  const checks: Array<[string, string]> = [
    [
      "listings table exists",
      "SELECT COUNT(*)::int AS c FROM listings",
    ],
    [
      "listing_offers table exists",
      "SELECT COUNT(*)::int AS c FROM listing_offers",
    ],
    [
      "message_unlocks table exists",
      "SELECT COUNT(*)::int AS c FROM message_unlocks",
    ],
    [
      "credit_usage table exists",
      "SELECT COUNT(*)::int AS c FROM credit_usage",
    ],
    [
      "teacher_applications.hourly_rate_online column",
      "SELECT hourly_rate_online FROM teacher_applications LIMIT 1",
    ],
    [
      "teacher_applications.hourly_rate_in_person column",
      "SELECT hourly_rate_in_person FROM teacher_applications LIMIT 1",
    ],
    [
      "teacher_applications.city column",
      "SELECT city FROM teacher_applications LIMIT 1",
    ],
    [
      "teacher_applications.district column",
      "SELECT district FROM teacher_applications LIMIT 1",
    ],
    [
      "users.meet_link is gone",
      "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='meet_link'",
    ],
    [
      "lesson_bookings is gone",
      "SELECT to_regclass('public.lesson_bookings') AS r",
    ],
    [
      "teacher_availability is gone",
      "SELECT to_regclass('public.teacher_availability') AS r",
    ],
    [
      "private_lesson_applications is gone",
      "SELECT to_regclass('public.private_lesson_applications') AS r",
    ],
    [
      "lesson_reviews is gone",
      "SELECT to_regclass('public.lesson_reviews') AS r",
    ],
    [
      "offer cap trigger installed",
      `SELECT tgname FROM pg_trigger WHERE tgname = 'trg_listing_offers_cap'`,
    ],
    [
      "offer count trigger installed",
      `SELECT tgname FROM pg_trigger WHERE tgname = 'trg_listing_offers_count'`,
    ],
  ];

  let failed = 0;
  for (const [name, sql] of checks) {
    try {
      const res = await client.query(sql);
      const ok = (() => {
        if (name.endsWith(" is gone")) {
          // These queries return null / empty row when the dropped
          // thing is gone.
          if (res.rows.length === 0) return true;
          const row = res.rows[0];
          return row.r == null && row.column_name == null;
        }
        if (name.endsWith(" trigger installed")) {
          return res.rows.length === 1;
        }
        return true;
      })();
      if (ok) {
        console.log(`  [OK]  ${name}`);
      } else {
        console.log(`  [FAIL] ${name} (rows=${JSON.stringify(res.rows)})`);
        failed++;
      }
    } catch (err) {
      console.log(`  [FAIL] ${name}: ${(err as Error).message}`);
      failed++;
    }
  }

  await client.end();
  if (failed > 0) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll marketplace schema checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
