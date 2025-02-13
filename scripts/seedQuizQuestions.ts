// scripts/seedQuizQuestions.ts

import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../db/schema";

// 1) Connect to DB
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// 2) Decide which "field" we are seeding.
//    e.g. run: `ts-node scripts/seedQuizQuestions.ts teacher_math`
//    otherwise, default to "EnglishSpeaking"
const FIELD_NAME = process.argv[2] || "EnglishSpeaking";

// 3) Generate (for example) 10 new questions. Change length to 50 if needed.
const QUESTION_COUNT = 50; // or 50
const questions = Array.from({ length: QUESTION_COUNT }, (_, i) => {
  // We'll pick a random correctIndex from 0..3
  const correctIndex = Math.floor(Math.random() * 4);

  return {
    questionText: `Q${i + 1} for field=${FIELD_NAME}?`,
    options: Array.from({ length: 4 }, (_, optIndex) => ({
      text: `Option ${String.fromCharCode(65 + optIndex)} for Q${i + 1}`,
      isCorrect: optIndex === correctIndex,
    })),
  };
});

async function main() {
  try {
    console.log(
      `Seeding ${QUESTION_COUNT} quiz questions for field="${FIELD_NAME}".`
    );

    for (const q of questions) {
      // Insert the question
      const insertedQ = await db
        .insert(schema.quizQuestions)
        .values({
          field: FIELD_NAME,
          questionText: q.questionText,
        })
        .returning({ id: schema.quizQuestions.id });

      const questionId = insertedQ[0].id;

      // Insert its 4 options
      for (const opt of q.options) {
        await db.insert(schema.quizOptions).values({
          questionId,
          text: opt.text,
          isCorrect: opt.isCorrect,
        });
      }
    }

    console.log(
      `Done! Inserted ${QUESTION_COUNT} questions for field="${FIELD_NAME}".`
    );
  } catch (error) {
    console.error("Error seeding quiz questions:", error);
    process.exit(1);
  }
}

main();
