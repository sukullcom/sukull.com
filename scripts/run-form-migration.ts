import "dotenv/config";
import fs from "fs";
import path from "path";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);

const main = async () => {
  try {
    console.log("Running form extension migration...");
    const sqlPath = path.join(process.cwd(), "supabase", "migrations", "0016_extend_application_forms.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    await client.unsafe(sql);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error running migration:", error);
    throw error;
  } finally {
    await client.end();
  }
};

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
