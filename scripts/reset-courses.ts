import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { courses, units, lessons, challenges, challengeOptions } from "@/db/schema";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString);
const db = drizzle(client);

async function resetCourses() {
  try {
    console.log("🗑️  Starting course data cleanup...");

    // Delete in order of dependencies (child tables first)
    console.log("Deleting challenge options...");
    await db.delete(challengeOptions);
    
    console.log("Deleting challenges...");
    await db.delete(challenges);
    
    console.log("Deleting lessons...");
    await db.delete(lessons);
    
    console.log("Deleting units...");
    await db.delete(units);
    
    console.log("Deleting courses...");
    await db.delete(courses);

    console.log("✅ Course data cleanup completed successfully!");
    console.log("📚 Ready for fresh course content creation");
  } catch (error) {
    console.error("❌ Error during course cleanup:", error);
    throw error;
  } finally {
    await client.end();
  }
}

resetCourses().catch(console.error); 