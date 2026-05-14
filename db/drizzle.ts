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

/**
 * Global query / lock timeouts.
 *
 * Niye burada? `Pool` üzerinde `options` veya `application_name` ile session
 * GUC set etme yolu yok; her bağlantı için tek seferlik SET çalıştırmak
 * gerekir. `pool.on('connect')` yeni alınan her bağlantıda tetiklenir, böylece:
 *   • Vercel'in 60 sn fonksiyon limitini aşmadan kullanıcının response'unu
 *     "stuck DB query" yüzünden geciktirmemiş oluruz.
 *   • Yanlış index veya kaçak `JOIN` ile gelen pahalı bir sorgu **tüm pool'u
 *     bloke etmesin** — 30 sn sonunda PostgreSQL otomatik iptal eder.
 *   • Lock kuyruğunda asla sonsuza dek beklenmez (`lock_timeout`).
 *
 * Üretim için cömert ama sınırlı: 30s sorgu, 10s lock. Manuel uzun çağrılar
 * (ör. teklif transaction'ı) gerekirse session içinde `SET LOCAL` ile
 * geçici olarak yükseltir; `offers.ts` zaten bu kalıbı kullanıyor.
 */
pool.on("connect", (client) => {
  client
    .query("SET statement_timeout = 30000; SET lock_timeout = 10000;")
    .catch((err) => {
      console.warn("[db] failed to set per-connection timeouts:", err?.message || err);
    });
});

const db = drizzle(pool, { schema });

export default db;
/** Ham `pg` sorguları (ör. `check_rate_limit(…::text, …::int)` tipli çağrı). */
export { pool as pgPool };
