import { sql } from "drizzle-orm";
import db from "../db/drizzle";
import fs from "fs";
import path from "path";

async function main() {
  try {
    console.log("Running snippets indexes migration...");
    
    const migrationPath = path.join(__dirname, "../supabase/migrations/0003_add_snippets_indexes.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    
    // Split by statement and execute each one
    const statements = migrationSQL
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await db.execute(sql.raw(statement));
    }
    
    console.log("Snippets indexes migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  }
}

main(); 