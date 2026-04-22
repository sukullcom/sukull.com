import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

// Prefer DIRECT_URL for migrations (session mode / direct 5432). Fall back to
// DATABASE_URL. The transaction pooler on port 6543 does not support DDL
// reliably, so always run migrations against a direct connection.
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: './db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl!,
  },
});

// Optional for Drizzle configuration
export const dbConfig = {
  ssl: {
    rejectUnauthorized: false
  }
};
