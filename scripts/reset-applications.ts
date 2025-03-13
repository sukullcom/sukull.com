import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../db/schema";

// Create a postgres-js client using the DATABASE_URL
const client = postgres(process.env.DATABASE_URL!);

// Initialize drizzle with the client and your schema
const db = drizzle(client, { schema });

const main = async () => {
    try {
        console.log("Resetting application data (preserving core content and user data)...");

        // Delete application data in proper order (respecting foreign key constraints)
        // These are the tables we WILL reset (applications, messages, etc.)
        
        // First batch - tables with direct foreign keys
        await Promise.all([
            db.delete(schema.studyBuddyMessages),
            db.delete(schema.quizOptions),
        ]);

        // Second batch
        await Promise.all([
            db.delete(schema.studyBuddyChats),
            db.delete(schema.snippets),
            db.delete(schema.quizQuestions),
        ]);

        // Third batch
        await Promise.all([
            db.delete(schema.teacherApplications),
            db.delete(schema.studyBuddyPosts),
            db.delete(schema.privateLessonApplications),
            db.delete(schema.englishGroupApplications),
        ]);

        // Reset schools' total points
        await db.update(schema.schools)
            .set({ totalPoints: 0 });

        console.log("Application data reset completed successfully!");
        console.log("The following tables were preserved:");
        console.log(" - courses");
        console.log(" - units");
        console.log(" - lessons");
        console.log(" - challenges");
        console.log(" - challengeOptions");
        console.log(" - users");
        console.log(" - userProgress");
        console.log(" - challengeProgress");
        console.log(" - schools (only reset totalPoints)");
        console.log(" - userDailyStreak");
    } catch (error) {
        console.error("Error during application data reset:", error);
        throw new Error("Failed to reset application data");
    } finally {
        // Close the database connection
        await client.end();
    }
};

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
}); 