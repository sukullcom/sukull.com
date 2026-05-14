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
  const looksLikeDirectDbHost =
    /db\.[a-z0-9-]+\.supabase\.co/i.test(connectionString) &&
    !connectionString.includes("pooler.supabase.com");
  if (!usingPooler) {
    const level = looksLikeDirectDbHost ? 'error' : 'warn';
    const logFn = level === 'error' ? console.error : console.warn;
    logFn(
      '[db] DATABASE_URL does not appear to use the Supabase transaction pooler ' +
        '(expected host *.pooler.supabase.com and port 6543). In serverless ' +
        'environments this will exhaust Postgres connections under load. ' +
        'Switch to the pooler URL from Supabase → Project Settings → Database → Connection Pooling.',
    );
  }
}

/**
 * Global query / lock timeouts via connection-level `options`.
 *
 * Niye `pool.on('connect')` SET değil?
 *   Supabase transaction pooler (PgBouncer transaction mode) session-level
 *   `SET` cümlelerini güvenilir tutmaz — her transaction sonunda reset
 *   edilebilir, bazı sürümlerde "prepared statement does not exist" hatası
 *   atar. `options=-c key=value` bağlantı kurulurken Postgres'e gönderilir;
 *   PgBouncer bunu opaque parameter olarak geçirir, pooler reset'ine bağışıktır.
 *
 * Üretim için cömert ama sınırlı: 30s sorgu, 10s lock. Uzun çalışan
 * istisnalar (`offers.ts` transaction'ı vb.) `SET LOCAL` ile session içinde
 * geçici olarak yükseltir.
 */
const POOL_OPTIONS = "-c statement_timeout=30000 -c lock_timeout=10000";

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
  options: POOL_OPTIONS,
});

const db = drizzle(pool, { schema });

export default db;
/** Ham `pg` sorguları (ör. `check_rate_limit(…::text, …::int)` tipli çağrı). */
export { pool as pgPool };
