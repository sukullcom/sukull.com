import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "../db/schema"

// Create a postgres-js client using the DATABASE_URL
const client = postgres(process.env.DATABASE_URL!)

// Initialize drizzle with the client and your schema
const db = drizzle(client, { schema })

const main = async () => {
    try {
        console.log("Resetting database...")

        // Delete all existing data in proper order (respecting foreign key constraints)
        // Start with tables that have foreign keys pointing to other tables
        await Promise.all([
            // First batch - tables with foreign keys to other tables
            db.delete(schema.challengeOptions),
            db.delete(schema.challengeProgress),
            db.delete(schema.quizOptions),
            db.delete(schema.userDailyStreak),
            db.delete(schema.studyBuddyMessages),
        ])

        // Second batch - tables that have relations but no circular dependencies
        await Promise.all([
            db.delete(schema.challenges),
            db.delete(schema.studyBuddyChats),
            db.delete(schema.snippets),
        ])

        // Third batch - tables that other tables depend on
        await Promise.all([
            db.delete(schema.lessons),
            db.delete(schema.teacherApplications),
            db.delete(schema.quizQuestions),
            db.delete(schema.studyBuddyPosts),
        ])

        // Fourth batch - tables with less dependencies
        await Promise.all([
            db.delete(schema.units),
            db.delete(schema.userProgress),
            db.delete(schema.privateLessonApplications),
            db.delete(schema.englishGroupApplications),
        ])

        // Final batch - base tables
        await Promise.all([
            db.delete(schema.courses),
            db.delete(schema.schools),
            db.delete(schema.users),
        ])

        console.log("Database reset completed successfully!")
    } catch (error) {
        console.error("Error during database reset:", error)
        throw new Error("Failed to reset the database")
    } finally {
        // Close the database connection
        await client.end()
    }
}

main().catch((err) => {
    console.error("Fatal error:", err)
    process.exit(1)
})