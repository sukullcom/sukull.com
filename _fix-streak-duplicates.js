/**
 * One-off script: Remove duplicate user_daily_streak rows before adding unique constraint.
 *
 * Usage: node _fix-streak-duplicates.js
 *
 * Requires DATABASE_URL in .env
 */
require("dotenv").config();
const { Pool } = require("pg");

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    // 1. Count duplicates
    const { rows: dups } = await client.query(`
      SELECT user_id, date::date as d, count(*) as cnt
      FROM user_daily_streak
      GROUP BY user_id, date::date
      HAVING count(*) > 1
    `);
    console.log(`Found ${dups.length} user/date pairs with duplicates`);

    // 2. For each duplicate group, keep the one with highest id (most recent) and delete the rest
    let deleted = 0;
    for (const dup of dups) {
      const res = await client.query(`
        DELETE FROM user_daily_streak
        WHERE id NOT IN (
          SELECT MAX(id) FROM user_daily_streak
          WHERE user_id = $1 AND date::date = $2
        )
        AND user_id = $1
        AND date::date = $2
      `, [dup.user_id, dup.d]);
      deleted += res.rowCount;
    }
    console.log(`Deleted ${deleted} duplicate rows`);

    // 3. Now add the unique index
    console.log("Adding unique index...");
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS user_daily_streak_user_date_idx
      ON user_daily_streak (user_id, date)
    `);
    console.log("Unique index created successfully!");

    // 4. Verify
    const { rows: verify } = await client.query(`
      SELECT count(*) as cnt FROM user_daily_streak
    `);
    console.log(`Total rows after cleanup: ${verify[0].cnt}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
