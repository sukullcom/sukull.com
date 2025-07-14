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
        console.log("🗑️  Starting COMPLETE database reset - clearing ALL data...")
        console.log("⚠️  This will delete ALL users, courses, progress, and application data!")
        
        // Delete all existing data in proper order (respecting foreign key constraints)
        
        // First batch - tables with foreign keys to other tables
        console.log("📝 Deleting challenge options, progress, and related data...")
        await Promise.all([
            db.delete(schema.challengeOptions),
            db.delete(schema.challengeProgress),
            db.delete(schema.quizOptions),
            db.delete(schema.userDailyStreak),
            db.delete(schema.studyBuddyMessages),
            db.delete(schema.lessonReviews),
        ])

        // Second batch - tables that have relations but no circular dependencies
        console.log("🎯 Deleting challenges, chats, and snippets...")
        await Promise.all([
            db.delete(schema.challenges),
            db.delete(schema.studyBuddyChats),
            db.delete(schema.snippets),
            db.delete(schema.lessonBookings),
            db.delete(schema.teacherAvailability),
            db.delete(schema.teacherFields),
        ])

        // Third batch - tables that other tables depend on
        console.log("📚 Deleting lessons, applications, and quiz questions...")
        await Promise.all([
            db.delete(schema.lessons),
            db.delete(schema.teacherApplications),
            db.delete(schema.quizQuestions),
            db.delete(schema.studyBuddyPosts),
            db.delete(schema.privateLessonApplications),
            db.delete(schema.englishGroupApplications),
        ])

        // Fourth batch - payment and credit related tables
        console.log("💳 Deleting payment, credit, and subscription data...")
        await Promise.all([
            db.delete(schema.creditTransactions),
            db.delete(schema.paymentLogs),
            db.delete(schema.userCredits),
            db.delete(schema.userSubscriptions),
        ])

        // Fifth batch - progress and user-related tables
        console.log("👤 Deleting user progress and related data...")
        await Promise.all([
            db.delete(schema.units),
            db.delete(schema.userProgress),
        ])

        // Sixth batch - base content tables
        console.log("🏗️  Deleting courses and schools...")
        await Promise.all([
            db.delete(schema.courses),
            db.delete(schema.schools),
        ])

        // Final batch - users (this will cascade to any remaining related data)
        console.log("👥 Deleting ALL users...")
        await db.delete(schema.users)

        console.log("🎉 COMPLETE database reset completed successfully!")
        console.log("📊 All data has been cleared:")
        console.log("   ✅ All users and authentication data")
        console.log("   ✅ All courses, units, lessons, and challenges")
        console.log("   ✅ All user progress and achievements")
        console.log("   ✅ All applications (teacher, student, private lesson)")
        console.log("   ✅ All payment, credit, and subscription data")
        console.log("   ✅ All study buddy content and messages")
        console.log("   ✅ All code snippets and shared content")
        console.log("   ✅ All bookings and availability data")
        console.log("   ✅ All schools and leaderboard data")
        console.log("")
        console.log("🚀 Database is now completely clean and ready for fresh content!")
        
    } catch (error) {
        console.error("❌ Error during complete database reset:", error)
        throw new Error("Failed to reset the database completely")
    } finally {
        // Close the database connection
        await client.end()
    }
}

// Run the reset with confirmation
console.log("⚠️  WARNING: This will delete ALL data from the database!")
console.log("   - All user accounts will be removed")
console.log("   - All course content will be deleted") 
console.log("   - All progress and achievements will be lost")
console.log("   - All payment and subscription data will be cleared")
console.log("")

main().catch((error) => {
    console.error("💥 Complete reset failed:", error)
    process.exit(1)
}) 