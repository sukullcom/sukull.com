import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  console.log("Starting migration to add new challenge types...");

  try {
    // First, add new columns to challenge_options table (these are simpler)
    console.log("Adding new columns to challenge_options table...");
    
    await client`
      ALTER TABLE "challenge_options" 
      ADD COLUMN IF NOT EXISTS "correct_order" integer;
    `;
    
    await client`
      ALTER TABLE "challenge_options" 
      ADD COLUMN IF NOT EXISTS "pair_id" integer;
    `;
    
    await client`
      ALTER TABLE "challenge_options" 
      ADD COLUMN IF NOT EXISTS "is_blank" boolean DEFAULT false;
    `;
    
    await client`
      ALTER TABLE "challenge_options" 
      ADD COLUMN IF NOT EXISTS "drag_data" text;
    `;
    
    console.log("✅ Successfully added columns to challenge_options table");

    // Add new columns to challenges table
    console.log("Adding new columns to challenges table...");
    
    await client`
      ALTER TABLE "challenges" 
      ADD COLUMN IF NOT EXISTS "time_limit" integer;
    `;
    
    await client`
      ALTER TABLE "challenges" 
      ADD COLUMN IF NOT EXISTS "metadata" text;
    `;
    
    console.log("✅ Successfully added columns to challenges table");

    // Now handle the enum type safely
    console.log("Adding new challenge types to enum...");
    
    // Create a new enum with all values
    await client`
      CREATE TYPE "type_new" AS ENUM (
        'SELECT', 
        'ASSIST', 
        'DRAG_DROP', 
        'FILL_BLANK', 
        'MATCH_PAIRS', 
        'SEQUENCE', 
        'TIMER_CHALLENGE'
      );
    `;
    
    // Update the column to use the new enum
    await client`
      ALTER TABLE "challenges" 
      ALTER COLUMN "type" TYPE "type_new" 
      USING "type"::text::"type_new";
    `;
    
    // Drop the old enum and rename the new one
    await client`DROP TYPE "type";`;
    await client`ALTER TYPE "type_new" RENAME TO "type";`;
    
    console.log("✅ Successfully updated challenge type enum");

    console.log("🎉 Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

main()
  .then(() => {
    console.log("Migration finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration error:", error);
    process.exit(1);
  }); 