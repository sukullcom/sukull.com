import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction
    ? { rejectUnauthorized: false, ca: process.env.CA_CERT }
    : false,
  max: isProduction ? 5 : 10,
  idleTimeoutMillis: isProduction ? 20_000 : 60_000,
  connectionTimeoutMillis: 10_000,
});

const db = drizzle(pool, { schema });

export default db;