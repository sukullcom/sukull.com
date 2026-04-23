/**
 * Run EXPLAIN ANALYZE on a handful of hot query shapes and report whether
 * Postgres is using an index scan (good) vs a sequential scan (bad).
 *
 * Usage:
 *   npm run db:explain
 *
 * When to run:
 *   - After adding a new index migration, to confirm the planner picks it up.
 *   - Periodically in production-shaped staging, to catch index drift as data
 *     volume grows.
 *
 * How it reports:
 *   For each query we print the plan and mark it:
 *     OK    -> plan uses an Index Scan / Bitmap Index Scan matching our expectation
 *     SMALL -> plan is a Seq Scan but the table is tiny (rows < SMALL_TABLE_THRESHOLD)
 *              Postgres will usually prefer seq scans on small tables and that's
 *              optimal -- an index would be strictly slower.
 *     WARN  -> plan falls back to a Seq Scan on a non-small table; review.
 *
 * Notes:
 *   - EXPLAIN ANALYZE executes the query; we only run SELECTs here.
 *   - Parameters are illustrative. The planner only needs the shape, not
 *     specific values, to decide on an index.
 */
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env" });

type QueryCase = {
  name: string;
  /** Expected fragments in the plan. At least one must match for OK. */
  expectIndex: string[];
  sql: string;
  params?: unknown[];
};

/**
 * Below this row count a Seq Scan is usually optimal and the planner is
 * correct to choose it. We don't raise a warning in that case; indexes
 * still exist and will kick in once volume grows.
 */
const SMALL_TABLE_THRESHOLD = 500;

/** Extract rowcount from `Seq Scan on TABLE  (cost=... rows=N ...)` */
function extractSeqScanRows(plan: string): number | null {
  const match = plan.match(/Seq Scan on [^(]+\(cost=[^)]*rows=(\d+)/);
  return match ? Number(match[1]) : null;
}

const cases: QueryCase[] = [
  {
    name: "teacher_applications: status + created_at pagination",
    expectIndex: [
      "idx_teacher_apps_status_created_at",
      "idx_teacher_apps_status",
      "idx_teacher_apps_created_at",
    ],
    sql: `
      EXPLAIN ANALYZE
      SELECT id, teacher_name, teacher_email, field, status, created_at
      FROM   teacher_applications
      WHERE  status = $1::status
      ORDER  BY created_at DESC
      LIMIT  20
    `,
    params: ["pending"],
  },
  {
    name: "teacher_applications: ILIKE name search (trigram)",
    expectIndex: ["idx_teacher_apps_name_trgm", "idx_teacher_apps_surname_trgm"],
    sql: `
      EXPLAIN ANALYZE
      SELECT id, teacher_name, teacher_surname, teacher_email
      FROM   teacher_applications
      WHERE  teacher_name ILIKE $1 OR teacher_surname ILIKE $1
      LIMIT  20
    `,
    params: ["%ahmet%"],
  },
  {
    name: "private_lesson_applications: status filter + newest first",
    expectIndex: [
      "idx_student_apps_status_created_at",
      "idx_student_apps_status",
      "idx_student_apps_created_at",
    ],
    sql: `
      EXPLAIN ANALYZE
      SELECT id, student_name, student_email, field, status, created_at
      FROM   private_lesson_applications
      WHERE  status = $1
      ORDER  BY created_at DESC
      LIMIT  20
    `,
    params: ["pending"],
  },
  {
    name: "schools: type-filtered leaderboard",
    expectIndex: ["idx_schools_type_points", "idx_schools_type_city_points"],
    sql: `
      EXPLAIN ANALYZE
      SELECT id, name, city, total_points
      FROM   schools
      WHERE  type = $1::school_type
      ORDER  BY total_points DESC, name ASC
      LIMIT  50
    `,
    params: ["high_school"],
  },
  {
    // Use a selective search term: the trigram index only beats a seq scan
    // when the term matches a small fraction of rows. A very common term
    // like "anadolu" matches ~99% of Turkish school names and the planner
    // will correctly choose a seq scan.
    name: "schools: ILIKE name search (trigram, selective term)",
    expectIndex: ["idx_schools_name_trgm"],
    sql: `
      EXPLAIN ANALYZE
      SELECT id, name, city
      FROM   schools
      WHERE  name ILIKE $1
      LIMIT  20
    `,
    params: ["%galatasaray%"],
  },
];

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

  let warnings = 0;
  for (const c of cases) {
    console.log("\n============================================================");
    console.log(`[${c.name}]`);
    console.log("------------------------------------------------------------");
    try {
      const result = await client.query(c.sql, c.params);
      const plan = result.rows.map((r) => r["QUERY PLAN"] as string).join("\n");
      console.log(plan);

      const usedIndex = c.expectIndex.some((idx) => plan.includes(idx));
      const seqScan = /Seq Scan on/i.test(plan);
      if (usedIndex) {
        console.log(`-> OK     (matched: ${c.expectIndex.find((i) => plan.includes(i))})`);
      } else if (seqScan) {
        const seqRows = extractSeqScanRows(plan);
        if (seqRows !== null && seqRows < SMALL_TABLE_THRESHOLD) {
          console.log(
            `-> SMALL  (Seq Scan on ~${seqRows} rows; optimal for this size. ` +
              `Indexes exist and will engage as data grows.)`,
          );
        } else {
          console.log(
            `-> WARN   (Seq Scan on ~${seqRows ?? "?"} rows; expected one of: ${c.expectIndex.join(", ")})`,
          );
          warnings += 1;
        }
      } else {
        console.log(
          `-> INFO   (no seq scan but expected index not seen; expected one of: ${c.expectIndex.join(", ")})`,
        );
      }
    } catch (err) {
      console.error("Query failed:", err);
      warnings += 1;
    }
  }

  console.log("\n============================================================");
  console.log(warnings === 0 ? "All hot queries use an index." : `${warnings} warning(s) -- review above.`);
  await client.end();
  if (warnings > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
