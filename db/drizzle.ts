import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Drizzle + pg pool configured for Vercel serverless + Supabase.
 *
 * Important: In production, DATABASE_URL MUST point to the Supabase transaction
 * pooler (port 6543, host `aws-*.pooler.supabase.com`). Direct connections
 * (port 5432) will exhaust Supabase's connection limits under load because
 * every Vercel lambda instance creates its own pool.
 *
 * Transaction-pooler constraints:
 *   - No prepared statements (Drizzle's default node-postgres driver is fine)
 *   - Short-lived connections; `max: 1` per lambda is ideal
 *
 * For migrations / long-running scripts, use the direct URL via DIRECT_URL
 * (not used at runtime here; drizzle-kit reads it via drizzle.config.ts).
 */

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

if (isProduction) {
  const usingPooler =
    connectionString.includes('pooler.supabase.com') ||
    connectionString.includes(':6543');
  if (!usingPooler) {
    console.warn(
      '[db] DATABASE_URL does not appear to use the Supabase transaction pooler ' +
        '(expected host *.pooler.supabase.com and port 6543). In serverless ' +
        'environments this will exhaust Postgres connections under load. ' +
        'Switch to the pooler URL from Supabase → Project Settings → Database → Connection Pooling.',
    );
  }
}

const pool = new Pool({
  connectionString,
  ssl: isProduction
    ? { rejectUnauthorized: false, ca: process.env.CA_CERT }
    : false,
  // In serverless, each lambda instance has its own pool. Keeping max low
  // minimizes simultaneous connections; the pooler handles fan-out upstream.
  max: isProduction ? 1 : 10,
  idleTimeoutMillis: isProduction ? 10_000 : 60_000,
  connectionTimeoutMillis: 10_000,
  // Disable keepAlive in serverless — idle connections get killed by the
  // platform anyway and keepAlive adds noise to logs on cold starts.
  keepAlive: !isProduction,
});

const db = drizzle(pool, { schema });

export default db;
