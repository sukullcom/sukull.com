import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { v4 as uuidv4 } from "uuid";

import * as schema from "../db/schema";

// Create a postgres-js client using the DATABASE_URL
const client = postgres(process.env.DATABASE_URL!);

// Initialize drizzle with the client and your schema
const db = drizzle(client, { schema });

// Flags for different seeding modes
const PRESERVE_EXISTING_DATA = process.argv.includes("--preserve");
const RESET_APPLICATIONS_ONLY = process.argv.includes("--reset-applications-only");
const MINIMAL_SEED = process.argv.includes("--minimal");

// Sample user IDs for consistent references
const ADMIN_USER_ID = "admin-" + uuidv4().substring(0, 8);
const TEACHER_USER_ID = "teacher-" + uuidv4().substring(0, 8);
const STUDENT_USER_ID = "student-" + uuidv4().substring(0, 8);

const main = async () => {
    try {
        console.log("Starting database seeding process...");

        if (RESET_APPLICATIONS_ONLY) {
            console.log("Resetting only application data (preserving core content and user data)...");
            
            // Delete application data in proper order (respecting foreign key constraints)
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
            
        } else if (PRESERVE_EXISTING_DATA) {
            console.log("Preserving existing data and only adding new seed data...");
            // In this mode, we don't delete any data, just add new data
            
        } else {
            console.log("Clearing existing data before seeding...");
            
            // Delete all existing data in proper order (respecting foreign key constraints)
            // Start with tables that have foreign keys pointing to other tables
            await Promise.all([
                // First batch - tables with foreign keys to other tables
                db.delete(schema.challengeOptions),
                db.delete(schema.challengeProgress),
                db.delete(schema.quizOptions),
                db.delete(schema.userDailyStreak),
                db.delete(schema.studyBuddyMessages),
            ]);
    
            // Second batch - tables that have relations but no circular dependencies
            await Promise.all([
                db.delete(schema.challenges),
                db.delete(schema.studyBuddyChats),
                db.delete(schema.snippets),
            ]);
    
            // Third batch - tables that other tables depend on
            await Promise.all([
                db.delete(schema.lessons),
                db.delete(schema.teacherApplications),
                db.delete(schema.quizQuestions),
                db.delete(schema.studyBuddyPosts),
            ]);
    
            // Fourth batch - tables with less dependencies
            await Promise.all([
                db.delete(schema.units),
                db.delete(schema.userProgress),
                db.delete(schema.privateLessonApplications),
                db.delete(schema.englishGroupApplications),
            ]);
    
            // Final batch - base tables
            await Promise.all([
                db.delete(schema.courses),
                db.delete(schema.schools),
                // We aren't deleting users by default to preserve authentication
                // If you need to delete users, uncomment the next line
                // db.delete(schema.users),
            ]);
        }

        // ============================
        // SEED USERS WITH ROLES
        // ============================
        console.log("Seeding users with roles...");
        
        await db.insert(schema.users).values([
            {
                id: ADMIN_USER_ID,
                email: "admin@sukull.com",
                name: "Admin User",
                description: "System administrator",
                avatar: "/avatars/admin.svg",
                provider: "email",
                links: [],
                role: "admin",
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: TEACHER_USER_ID,
                email: "teacher@sukull.com",
                name: "Sample Teacher",
                description: "Experienced science teacher",
                avatar: "/avatars/teacher.svg",
                provider: "email",
                links: [],
                role: "teacher",
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: STUDENT_USER_ID,
                email: "student@sukull.com",
                name: "Sample Student",
                description: "Eager learner",
                avatar: "/avatars/student.svg",
                provider: "email",
                links: [],
                role: "user", // Regular student role
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]).onConflictDoUpdate({
            target: schema.users.id,
            set: {
                updated_at: new Date()
            }
        });

        // ============================
        // SEED SCHOOLS
        // ============================
        console.log("Seeding schools...");
        
        const schools = await db.insert(schema.schools).values([
            { name: "Boğaziçi Üniversitesi", totalPoints: 0, type: "university" },
            { name: "İstanbul Teknik Üniversitesi", totalPoints: 0, type: "university" },
            { name: "Orta Doğu Teknik Üniversitesi", totalPoints: 0, type: "university" },
            { name: "Antalya Fen Lisesi", totalPoints: 0, type: "high_school" },
            { name: "Kadıköy Anadolu Lisesi", totalPoints: 0, type: "high_school" },
            { name: "Beşiktaş Ortaokulu", totalPoints: 0, type: "secondary_school" },
            { name: "Ataşehir İlkokulu", totalPoints: 0, type: "elementary_school" },
        ]).returning();

        // ============================
        // SEED COURSES
        // ============================
        console.log("Seeding courses...");
        
        const courses = await db.insert(schema.courses).values([
            {
                id: 1,
                title: "Matematik",
                imageSrc: "/subjects/matematik.svg",
            },
            {
                id: 2,
                title: "Fizik",
                imageSrc: "/subjects/fizik.svg",
            },
            {
                id: 3,
                title: "Kimya",
                imageSrc: "/subjects/kimya.svg",
            },
            {
                id: 4,
                title: "Biyoloji",
                imageSrc: "/subjects/biyoloji.svg",
            },
            {
                id: 5,
                title: "Bilgisayar Bilimleri",
                imageSrc: "/subjects/bilgisayar.svg",
            }
        ]).returning();

        // ============================
        // SEED USER PROGRESS
        // ============================
        console.log("Seeding user progress...");
        
        await db.insert(schema.userProgress).values([
            {
                userId: STUDENT_USER_ID,
                userName: "Sample Student",
                userImageSrc: "/avatars/student.svg",
                activeCourseId: 1, // Matematik
                hearts: 5,
                points: 100,
                schoolId: schools[3].id, // Antalya Fen Lisesi
                profileLocked: false,
                istikrar: 3,
                dailyTarget: 50,
                lastStreakCheck: new Date(),
                previousTotalPoints: 50,
            },
            {
                userId: TEACHER_USER_ID,
                userName: "Sample Teacher",
                userImageSrc: "/avatars/teacher.svg",
                activeCourseId: 3, // Kimya
                hearts: 5,
                points: 250,
                schoolId: schools[0].id, // Boğaziçi Üniversitesi
                profileLocked: false,
                istikrar: 10,
                dailyTarget: 100,
                lastStreakCheck: new Date(),
                previousTotalPoints: 200,
            },
        ]);

        // Skip the rest of the seeding if minimal mode is enabled
        if (MINIMAL_SEED) {
            console.log("Minimal seeding completed successfully!");
            return;
        }

        // ============================
        // SEED UNITS
        // ============================
        console.log("Seeding units...");
        
        const units = await db.insert(schema.units).values([
            {
                id: 1,
                courseId: 1, // Matematik
                title: "Sayılar ve İşlemler",
                description: "Temel sayı kavramları ve aritmetik işlemler",
                order: 1,
            },
            {
                id: 2,
                courseId: 1, // Matematik
                title: "Cebir",
                description: "Denklemler ve bilinmeyenler ile işlemler",
                order: 2,
            },
            {
                id: 3,
                courseId: 2, // Fizik
                title: "Hareket ve Kuvvet",
                description: "Newton yasaları ve hareket fiziği",
                order: 1,
            },
            {
                id: 4,
                courseId: 3, // Kimya
                title: "Maddenin Yapısı",
                description: "Atomlar, moleküller ve periyodik tablo",
                order: 1,
            },
            {
                id: 5,
                courseId: 4, // Biyoloji
                title: "Hücre Biyolojisi",
                description: "Hücre yapısı ve fonksiyonları",
                order: 1,
            },
            {
                id: 6,
                courseId: 5, // Bilgisayar Bilimleri
                title: "Algoritma Temelleri",
                description: "Temel programlama kavramları",
                order: 1,
            },
        ]).returning();

        // ============================
        // SEED LESSONS
        // ============================
        console.log("Seeding lessons...");
        
        const lessons = await db.insert(schema.lessons).values([
            // Matematik lessons
            {
                id: 1,
                unitId: 1, // Sayılar ve İşlemler
                title: "Doğal Sayılar",
                order: 1,
            },
            {
                id: 2,
                unitId: 1, // Sayılar ve İşlemler
                title: "Tam Sayılar",
                order: 2,
            },
            {
                id: 3,
                unitId: 2, // Cebir
                title: "Denklem Çözümleri",
                order: 1,
            },
            // Fizik lessons
            {
                id: 4,
                unitId: 3, // Hareket ve Kuvvet
                title: "Newton Yasaları",
                order: 1,
            },
            // Kimya lessons
            {
                id: 5,
                unitId: 4, // Maddenin Yapısı
                title: "Atom Modelleri",
                order: 1,
            },
            // Biyoloji lessons
            {
                id: 6,
                unitId: 5, // Hücre Biyolojisi
                title: "Hücre Zarı",
                order: 1,
            },
            // Bilgisayar Bilimleri lessons
            {
                id: 7,
                unitId: 6, // Algoritma Temelleri
                title: "Değişkenler ve Veri Tipleri",
                order: 1,
            },
        ]).returning();

        // ============================
        // SEED CHALLENGES
        // ============================
        console.log("Seeding challenges...");
        
        const challenges = await db.insert(schema.challenges).values([
            // Mathematics challenges
            {
                id: 1,
                lessonId: 1, // Doğal Sayılar
                type: "SELECT",
                question: "Aşağıdakilerden hangisi doğal sayıdır?",
                order: 1,
            },
            {
                id: 2,
                lessonId: 1, // Doğal Sayılar
                type: "ASSIST",
                question: "En küçük doğal sayı",
                order: 2,
            },
            // Physics challenges
            {
                id: 3,
                lessonId: 4, // Newton Yasaları
                type: "SELECT",
                question: "Newton'un hangi yasası 'Eylemsizlik Yasası' olarak bilinir?",
                order: 1,
            },
            // Chemistry challenges
            {
                id: 4,
                lessonId: 5, // Atom Modelleri
                type: "SELECT",
                question: "Modern atom modelini ortaya koyan bilim insanı kimdir?",
                order: 1,
            },
            // Biology challenges
            {
                id: 5,
                lessonId: 6, // Hücre Zarı
                type: "SELECT",
                question: "Hücre zarının temel yapısı nedir?",
                order: 1,
            },
            // Computer Science challenges
            {
                id: 6,
                lessonId: 7, // Değişkenler ve Veri Tipleri
                type: "SELECT",
                question: "Aşağıdakilerden hangisi JavaScript'te bir veri tipi değildir?",
                order: 1,
            },
        ]).returning();

        // ============================
        // SEED CHALLENGE OPTIONS
        // ============================
        console.log("Seeding challenge options...");
        
        await db.insert(schema.challengeOptions).values([
            // Options for challenge 1 (Doğal Sayılar)
            {
                challengeId: 1,
                text: "0",
                correct: false,
            },
            {
                challengeId: 1,
                text: "1",
                correct: true,
            },
            {
                challengeId: 1,
                text: "-5",
                correct: false,
            },
            {
                challengeId: 1,
                text: "3.14",
                correct: false,
            },
            // Options for challenge 2 (En küçük doğal sayı)
            {
                challengeId: 2,
                text: "0",
                correct: false,
            },
            {
                challengeId: 2,
                text: "1",
                correct: true,
            },
            {
                challengeId: 2,
                text: "-1",
                correct: false,
            },
            // Options for challenge 3 (Newton's Law)
            {
                challengeId: 3,
                text: "Birinci Yasa",
                correct: true,
            },
            {
                challengeId: 3,
                text: "İkinci Yasa",
                correct: false,
            },
            {
                challengeId: 3,
                text: "Üçüncü Yasa",
                correct: false,
            },
            // Options for challenge 4 (Atom Model)
            {
                challengeId: 4,
                text: "Niels Bohr",
                correct: false,
            },
            {
                challengeId: 4,
                text: "Ernest Rutherford",
                correct: false,
            },
            {
                challengeId: 4,
                text: "Erwin Schrödinger",
                correct: true,
            },
            {
                challengeId: 4,
                text: "John Dalton",
                correct: false,
            },
            // Options for challenge 5 (Cell Membrane)
            {
                challengeId: 5,
                text: "Fosfolipid çift tabaka",
                correct: true,
            },
            {
                challengeId: 5,
                text: "Protein zincirleri",
                correct: false,
            },
            {
                challengeId: 5,
                text: "Karbonhidrat ağı",
                correct: false,
            },
            {
                challengeId: 5,
                text: "DNA sarmalı",
                correct: false,
            },
            // Options for challenge 6 (JavaScript data types)
            {
                challengeId: 6,
                text: "string",
                correct: false,
            },
            {
                challengeId: 6,
                text: "number",
                correct: false,
            },
            {
                challengeId: 6,
                text: "integer",
                correct: true, // integer is not a type in JS
            },
            {
                challengeId: 6,
                text: "boolean",
                correct: false,
            },
        ]);

        // ============================
        // SEED CHALLENGE PROGRESS
        // ============================
        console.log("Seeding challenge progress...");
        
        await db.insert(schema.challengeProgress).values([
            {
                userId: STUDENT_USER_ID,
                challengeId: 1,
                completed: true,
            },
            {
                userId: STUDENT_USER_ID,
                challengeId: 2,
                completed: true,
            },
            {
                userId: STUDENT_USER_ID,
                challengeId: 3,
                completed: false,
            },
        ]);

        // ============================
        // SEED USER DAILY STREAK
        // ============================
        console.log("Seeding user daily streak...");
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        await db.insert(schema.userDailyStreak).values([
            {
                userId: STUDENT_USER_ID,
                date: yesterday,
                achieved: true,
            },
            {
                userId: STUDENT_USER_ID,
                date: twoDaysAgo,
                achieved: true,
            },
            {
                userId: TEACHER_USER_ID,
                date: yesterday,
                achieved: true,
            },
        ]);

        // ============================
        // SEED QUIZ QUESTIONS AND OPTIONS
        // ============================
        console.log("Seeding quiz questions and options...");
        
        const quizQuestions = await db.insert(schema.quizQuestions).values([
            {
                field: "matematik",
                questionText: "Bir dik üçgende hipotenüs uzunluğunu veren formül hangisidir?",
            },
            {
                field: "fizik",
                questionText: "Hareket halindeki bir cismin kinetik enerjisi nasıl hesaplanır?",
            },
            {
                field: "kimya",
                questionText: "Periyodik tabloda elementler nasıl sıralanır?",
            },
        ]).returning();
        
        await db.insert(schema.quizOptions).values([
            // Options for mathematics question
            {
                questionId: quizQuestions[0].id,
                text: "a² + b² = c²",
                isCorrect: true,
            },
            {
                questionId: quizQuestions[0].id,
                text: "a² - b² = c²",
                isCorrect: false,
            },
            {
                questionId: quizQuestions[0].id,
                text: "a + b = c",
                isCorrect: false,
            },
            {
                questionId: quizQuestions[0].id,
                text: "a × b = c²",
                isCorrect: false,
            },
            // Options for physics question
            {
                questionId: quizQuestions[1].id,
                text: "E = mc²",
                isCorrect: false,
            },
            {
                questionId: quizQuestions[1].id,
                text: "E = 1/2 × m × v²",
                isCorrect: true,
            },
            {
                questionId: quizQuestions[1].id,
                text: "E = m × g × h",
                isCorrect: false,
            },
            {
                questionId: quizQuestions[1].id,
                text: "E = F × d",
                isCorrect: false,
            },
            // Options for chemistry question
            {
                questionId: quizQuestions[2].id,
                text: "Alfabetik sıraya göre",
                isCorrect: false,
            },
            {
                questionId: quizQuestions[2].id,
                text: "Atom numarasına göre artan sırada",
                isCorrect: true,
            },
            {
                questionId: quizQuestions[2].id,
                text: "Keşfedilme tarihine göre",
                isCorrect: false,
            },
            {
                questionId: quizQuestions[2].id,
                text: "Atom ağırlığına göre azalan sırada",
                isCorrect: false,
            },
        ]);

        // ============================
        // SEED STUDY BUDDY POSTS AND CHATS
        // ============================
        console.log("Seeding study buddy posts and chats...");
        
        const studyBuddyPosts = await db.insert(schema.studyBuddyPosts).values([
            {
                user_id: STUDENT_USER_ID,
                purpose: "Matematik Çalışma Arkadaşı",
                reason: "LGS sınavına hazırlanıyorum ve matematik konusunda birlikte çalışabileceğim bir arkadaş arıyorum.",
                created_at: new Date(),
            },
            {
                user_id: TEACHER_USER_ID,
                purpose: "Kimya Dersi Yardımı",
                reason: "Öğrencilerime daha iyi yardımcı olabilmek için kimya konusunda kendimi geliştirmek istiyorum.",
                created_at: new Date(),
            },
        ]).returning();
        
        const studyBuddyChats = await db.insert(schema.studyBuddyChats).values([
            {
                participants: [STUDENT_USER_ID, TEACHER_USER_ID],
                last_message: "Merhaba, yarın saat 17:00'da çalışabilir miyiz?",
                last_updated: new Date(),
            },
        ]).returning();
        
        await db.insert(schema.studyBuddyMessages).values([
            {
                chat_id: studyBuddyChats[0].id,
                sender: STUDENT_USER_ID,
                content: "Merhaba, size study buddy isteği göndermek istiyorum.",
                created_at: new Date(Date.now() - 3600000), // 1 hour ago
            },
            {
                chat_id: studyBuddyChats[0].id,
                sender: TEACHER_USER_ID,
                content: "Merhaba, tabii ki yardımcı olabilirim. Hangi konuda çalışmak istiyorsun?",
                created_at: new Date(Date.now() - 1800000), // 30 minutes ago
            },
            {
                chat_id: studyBuddyChats[0].id,
                sender: STUDENT_USER_ID,
                content: "Merhaba, yarın saat 17:00'da çalışabilir miyiz?",
                created_at: new Date(),
            },
        ]);

        // ============================
        // SEED CODE SNIPPETS
        // ============================
        console.log("Seeding code snippets...");
        
        await db.insert(schema.snippets).values([
            {
                userId: STUDENT_USER_ID,
                userName: "Sample Student",
                code: "console.log('Merhaba, Dünya!');",
                title: "İlk JavaScript Kodum",
                description: "JavaScript ile yazdığım ilk kod.",
                language: "javascript",
                createdAt: new Date(),
            },
            {
                userId: TEACHER_USER_ID,
                userName: "Sample Teacher",
                code: "def merhaba_dunya():\n    print('Merhaba, Dünya!')\n\nmerhaba_dunya()",
                title: "Python Fonksiyon Örneği",
                description: "Basit bir Python fonksiyonu.",
                language: "python",
                createdAt: new Date(),
            },
        ]);

        // ============================
        // SEED APPLICATIONS
        // ============================
        console.log("Seeding applications...");
        
        // Teacher applications
        await db.insert(schema.teacherApplications).values([
            {
                userId: STUDENT_USER_ID,
                field: "matematik",
                quizResult: 85,
                passed: true,
                teacherName: "Ahmet",
                teacherSurname: "Yılmaz",
                teacherPhoneNumber: "+905551234567",
                teacherEmail: "ahmet.yilmaz@example.com",
                classification: "Ortaokul Matematik",
                status: "pending",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
        
        // Private lesson applications
        await db.insert(schema.privateLessonApplications).values([
            {
                studentName: "Ayşe",
                studentSurname: "Öztürk",
                studentPhoneNumber: "+905559876543",
                studentEmail: "ayse.ozturk@example.com",
                field: "fizik",
                studentNeeds: "Lise fizik derslerinde zorlanıyorum, özellikle mekanik konularında yardıma ihtiyacım var.",
            },
        ]);
        
        // English group applications
        await db.insert(schema.englishGroupApplications).values([
            {
                participantName: "Mehmet",
                participantSurname: "Kaya",
                participantPhoneNumber: "+905553456789",
                participantEmail: "mehmet.kaya@example.com",
                quizResult: 75,
                classification: "B1",
            },
        ]);

        console.log("Seeding completed successfully!");
        console.log("Sample users created with the following roles:");
        console.log(`- Admin (ID: ${ADMIN_USER_ID})`);
        console.log(`- Teacher (ID: ${TEACHER_USER_ID})`);
        console.log(`- Student (ID: ${STUDENT_USER_ID})`);
        console.log("You can now run specialized seed scripts for full subject content:");
        console.log(" - npm run db:seed-all-grades    (Seeds all subjects for all grades)");
        console.log(" - npm run db:matematik-7        (Seeds mathematics for 7th grade)");
        console.log(" - npm run db:fizik-8            (Seeds physics for 8th grade)");
        
    } catch (error) {
        console.error("Error during database seeding:", error);
        throw new Error("Failed to seed the database");
    } finally {
        // Close the database connection
        await client.end();
    }
};

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
}); 