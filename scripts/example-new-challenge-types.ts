import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

// This is an example script showing how to create different types of challenges
// Run this after the migration to test the new challenge types

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function createExampleChallenges() {
  console.log("Creating example challenges for new challenge types...");

  try {
    // 1. DRAG_DROP Challenge Example
    console.log("Creating DRAG_DROP challenge...");
    
    const [dragDropChallenge] = await db
      .insert(schema.challenges)
      .values({
        lessonId: 1, // Replace with actual lesson ID
        type: "DRAG_DROP",
        question: "Match the words to their meanings",
        order: 1,
      })
      .returning();

    // Create drag drop options
    await db.insert(schema.challengeOptions).values([
      {
        challengeId: dragDropChallenge.id,
        text: "Apple",
        correct: false,
        dragData: JSON.stringify({ type: "item", itemId: 1 }),
      },
      {
        challengeId: dragDropChallenge.id,
        text: "Elma",
        correct: false,
        dragData: JSON.stringify({ type: "item", itemId: 2 }),
      },
      {
        challengeId: dragDropChallenge.id,
        text: "English Word",
        correct: false,
        dragData: JSON.stringify({ type: "zone", zoneId: "english", correctItemId: 1 }),
      },
      {
        challengeId: dragDropChallenge.id,
        text: "Turkish Word",
        correct: false,
        dragData: JSON.stringify({ type: "zone", zoneId: "turkish", correctItemId: 2 }),
      },
      {
        challengeId: dragDropChallenge.id,
        text: "Correct",
        correct: true, // This marks the challenge as correct when completed
      },
    ]);

    // 2. FILL_BLANK Challenge Example
    console.log("Creating FILL_BLANK challenge...");
    
    const [fillBlankChallenge] = await db
      .insert(schema.challenges)
      .values({
        lessonId: 1, // Replace with actual lesson ID
        type: "FILL_BLANK",
        question: "The {1} runs fast and the {2} flies high.",
        order: 2,
      })
      .returning();

    await db.insert(schema.challengeOptions).values([
      {
        challengeId: fillBlankChallenge.id,
        text: "car",
        correct: false,
        isBlank: true,
      },
      {
        challengeId: fillBlankChallenge.id,
        text: "bird",
        correct: false,
        isBlank: true,
      },
      {
        challengeId: fillBlankChallenge.id,
        text: "Correct",
        correct: true,
      },
    ]);

    // 3. MATCH_PAIRS Challenge Example
    console.log("Creating MATCH_PAIRS challenge...");
    
    const [matchPairsChallenge] = await db
      .insert(schema.challenges)
      .values({
        lessonId: 1, // Replace with actual lesson ID
        type: "MATCH_PAIRS",
        question: "Match the pairs by clicking on cards",
        order: 3,
      })
      .returning();

    await db.insert(schema.challengeOptions).values([
      {
        challengeId: matchPairsChallenge.id,
        text: "Hello",
        correct: false,
        pairId: 1,
      },
      {
        challengeId: matchPairsChallenge.id,
        text: "Merhaba",
        correct: false,
        pairId: 1,
      },
      {
        challengeId: matchPairsChallenge.id,
        text: "Goodbye",
        correct: false,
        pairId: 2,
      },
      {
        challengeId: matchPairsChallenge.id,
        text: "Hoşçakal",
        correct: false,
        pairId: 2,
      },
      {
        challengeId: matchPairsChallenge.id,
        text: "Correct",
        correct: true,
      },
    ]);

    // 4. SEQUENCE Challenge Example
    console.log("Creating SEQUENCE challenge...");
    
    const [sequenceChallenge] = await db
      .insert(schema.challenges)
      .values({
        lessonId: 1, // Replace with actual lesson ID
        type: "SEQUENCE",
        question: "Put the steps in the correct order",
        order: 4,
      })
      .returning();

    await db.insert(schema.challengeOptions).values([
      {
        challengeId: sequenceChallenge.id,
        text: "Turn on the computer",
        correct: false,
        correctOrder: 1,
      },
      {
        challengeId: sequenceChallenge.id,
        text: "Open the browser",
        correct: false,
        correctOrder: 2,
      },
      {
        challengeId: sequenceChallenge.id,
        text: "Go to website",
        correct: false,
        correctOrder: 3,
      },
      {
        challengeId: sequenceChallenge.id,
        text: "Login to account",
        correct: false,
        correctOrder: 4,
      },
      {
        challengeId: sequenceChallenge.id,
        text: "Correct",
        correct: true,
      },
    ]);

    // 5. TIMER_CHALLENGE Example (wrapping a SELECT challenge)
    console.log("Creating TIMER_CHALLENGE challenge...");
    
    const [timerChallenge] = await db
      .insert(schema.challenges)
      .values({
        lessonId: 1, // Replace with actual lesson ID
        type: "TIMER_CHALLENGE",
        question: "Quick! What is 2 + 2?",
        order: 5,
        timeLimit: 10, // 10 seconds
        metadata: JSON.stringify({ baseType: "SELECT" }),
      })
      .returning();

    await db.insert(schema.challengeOptions).values([
      {
        challengeId: timerChallenge.id,
        text: "3",
        correct: false,
      },
      {
        challengeId: timerChallenge.id,
        text: "4",
        correct: true,
      },
      {
        challengeId: timerChallenge.id,
        text: "5",
        correct: false,
      },
      {
        challengeId: timerChallenge.id,
        text: "6",
        correct: false,
      },
    ]);

    console.log("✅ Successfully created example challenges for all new types!");

  } catch (error) {
    console.error("❌ Failed to create example challenges:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Uncomment to run this example
// createExampleChallenges()
//   .then(() => {
//     console.log("Example challenges created successfully!");
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error("Error creating example challenges:", error);
//     process.exit(1);
//   });

export { createExampleChallenges }; 