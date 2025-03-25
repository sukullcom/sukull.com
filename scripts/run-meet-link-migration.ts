import "dotenv/config";
import fs from "fs";
import path from "path";
import postgres from "postgres";

// Create a postgres-js client using the DATABASE_URL
const client = postgres(process.env.DATABASE_URL!);

async function main() {
  console.log("Running Google Meet link migration...");
  
  try {
    // Read the SQL migration file
    const sqlPath = path.join(process.cwd(), "db", "migrations", "add_meet_link_field.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    // Execute the SQL commands
    await client.unsafe(sql);
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error running migration:", error);
    throw new Error("Failed to run migration");
  } finally {
    // Close the database connection
    await client.end();
  }
}

main().catch(console.error); 