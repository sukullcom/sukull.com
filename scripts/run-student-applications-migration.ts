import "dotenv/config";
import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Function to run the migration
async function main() {
  console.log("Starting student applications migration...");

  // Create a PostgreSQL client
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "db", "migrations", "update_student_applications.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Execute the SQL
    console.log("Executing SQL...");
    await db.execute(sql);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Run the migration
main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
}); 