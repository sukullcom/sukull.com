import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create a pool with SSL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    // For older Node.js versions, you might need to specify the CA certificate
    // ca: fs.readFileSync('/path/to/ca-certificate.crt').toString()
  }
});

// Create drizzle instance with the pool
const db = drizzle(pool, { schema });

export default db;