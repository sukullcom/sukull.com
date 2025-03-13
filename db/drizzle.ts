import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

config({ path: '.env' });

// Configure connection pooling for better performance and resource management
const client = postgres(process.env.DATABASE_URL!, {
  max: 20, // Increased from 10 to handle more concurrent connections
  idle_timeout: 30, // Increased idle timeout to reduce connection churn
  connect_timeout: 15, // Increased connect timeout for reliability
  max_lifetime: 60 * 30, // Max connection lifetime of 30 minutes
  prepare: false, // Disable prepared statements for better performance with Supabase
  ssl: process.env.NODE_ENV === 'production', // Enable SSL in production
  onnotice: () => {}, // Suppress notice messages
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
  connection: {
    application_name: 'sukull_app', // Identify connections in database logs
  },
  types: {
    // Optimize date handling
    date: {
      to: 1184,
      from: [1082, 1083, 1114, 1184],
      serialize: (date: Date) => date,
      parse: (date: string | Date) => date,
    },
  },
});

// Initialize Drizzle with the client and schema
const db = drizzle(client, { schema });

// Export the database instance
export default db;