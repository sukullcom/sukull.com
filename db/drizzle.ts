import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

config({ path: '.env' }); // or use .env.local if that's your configuration file

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export default db