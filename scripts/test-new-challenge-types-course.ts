require("dotenv/config");
const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const schema = require("../db/schema");

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function createTestCourse() {
  console.log("Creating Test Course for New Challenge Types...");

  try {
    // Create the test course
    const [course] = await db
      .insert(schema.courses)
      .values({
        title: "Programming Concepts Test Course",
        imageSrc: "/course_logos/test.svg",
      })
      .returning();

    console.log(`✅ Created course: ${course.title}`);

    // Create a unit for the test course
    const [unit] = await db
      .insert(schema.units)
      .values({
        courseId: course.id,
        title: "Challenge Types Demo",
        description: "Testing all new challenge types",
        order: 1,
      })
      .returning();

    console.log(`✅ Created unit: ${unit.title}`);

    // Create lessons for each challenge type
    const lessons = await db
      .insert(schema.lessons)
      .values([
        {
          unitId: unit.id,
          order: 1,
          title: "Drag & Drop Challenge Demo",
        },
        {
          unitId: unit.id,
          order: 2,
          title: "Fill in the Blanks Demo",
        },
        {
          unitId: unit.id,
          order: 3,
          title: "Match Pairs Memory Game",
        },
        {
          unitId: unit.id,
          order: 4,
          title: "Sequence Ordering Demo",
        },
        {
          unitId: unit.id,
          order: 5,
          title: "Timed Challenge Demo",
        },
        {
          unitId: unit.id,
          order: 6,
          title: "Classic Challenges (SELECT/ASSIST)",
        },
      ])
      .returning();

    console.log(`✅ Created ${lessons.length} lessons`);

    // Create challenges for each lesson
    await createDragDropChallenges(lessons[0].id);
    await createFillBlankChallenges(lessons[1].id);
    await createMatchPairsChallenges(lessons[2].id);
    await createSequenceChallenges(lessons[3].id);
    await createTimerChallenges(lessons[4].id);
    await createClassicChallenges(lessons[5].id);

    console.log("🎉 Test course created successfully!");
    console.log(`Course ID: ${course.id}`);
    console.log("You can now test all challenge types in this course!");

  } catch (error) {
    console.error("❌ Failed to create test course:", error);
    throw error;
  } finally {
    await client.end();
  }
}

async function createDragDropChallenges(lessonId: number) {
  console.log("Creating DRAG_DROP challenges...");

  // Challenge 1: Match programming concepts to categories
  const [challenge1] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "DRAG_DROP",
      question: "Drag each programming concept to the correct category",
      order: 1,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    // Items to drag
    {
      challengeId: challenge1.id,
      text: "if statement",
      correct: false,
      dragData: JSON.stringify({ type: "item", itemId: 1 }),
    },
    {
      challengeId: challenge1.id,
      text: "for loop",
      correct: false,
      dragData: JSON.stringify({ type: "item", itemId: 2 }),
    },
    {
      challengeId: challenge1.id,
      text: "array",
      correct: false,
      dragData: JSON.stringify({ type: "item", itemId: 3 }),
    },
    {
      challengeId: challenge1.id,
      text: "string",
      correct: false,
      dragData: JSON.stringify({ type: "item", itemId: 4 }),
    },
    // Drop zones
    {
      challengeId: challenge1.id,
      text: "Control Structures",
      correct: false,
      dragData: JSON.stringify({ type: "zone", zoneId: "control", correctItemId: 1 }),
    },
    {
      challengeId: challenge1.id,
      text: "Loops",
      correct: false,
      dragData: JSON.stringify({ type: "zone", zoneId: "loops", correctItemId: 2 }),
    },
    {
      challengeId: challenge1.id,
      text: "Data Types",
      correct: false,
      dragData: JSON.stringify({ type: "zone", zoneId: "data", correctItemId: 3 }),
    },
    {
      challengeId: challenge1.id,
      text: "Data Types",
      correct: false,
      dragData: JSON.stringify({ type: "zone", zoneId: "data2", correctItemId: 4 }),
    },
    // Correct answer marker
    {
      challengeId: challenge1.id,
      text: "Correct",
      correct: true,
    },
  ]);

  // Challenge 2: Code syntax matching
  const [challenge2] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "DRAG_DROP",
      question: "Match the code syntax to the correct programming language",
      order: 2,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    // Code snippets
    {
      challengeId: challenge2.id,
      text: "console.log('Hello')",
      correct: false,
      dragData: JSON.stringify({ type: "item", itemId: 1 }),
    },
    {
      challengeId: challenge2.id,
      text: "print('Hello')",
      correct: false,
      dragData: JSON.stringify({ type: "item", itemId: 2 }),
    },
    // Languages
    {
      challengeId: challenge2.id,
      text: "JavaScript",
      correct: false,
      dragData: JSON.stringify({ type: "zone", zoneId: "js", correctItemId: 1 }),
    },
    {
      challengeId: challenge2.id,
      text: "Python",
      correct: false,
      dragData: JSON.stringify({ type: "zone", zoneId: "python", correctItemId: 2 }),
    },
    {
      challengeId: challenge2.id,
      text: "Correct",
      correct: true,
    },
  ]);
}

async function createFillBlankChallenges(lessonId: number) {
  console.log("Creating FILL_BLANK challenges...");

  // Challenge 1: Complete the code
  const [challenge1] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "FILL_BLANK",
      question: "Complete the JavaScript code: function {1}(name) { {2}.log('Hello ' + name); }",
      order: 1,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    {
      challengeId: challenge1.id,
      text: "greet",
      correct: false,
      isBlank: true,
    },
    {
      challengeId: challenge1.id,
      text: "console",
      correct: false,
      isBlank: true,
    },
    {
      challengeId: challenge1.id,
      text: "Correct",
      correct: true,
    },
  ]);

  // Challenge 2: Multiple choice fill-in-the-blank
  const [challenge2] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "FILL_BLANK",
      question: "In programming, a {1} is used to store multiple values in a single variable.",
      order: 2,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    {
      challengeId: challenge2.id,
      text: "array",
      correct: false,
      isBlank: true,
    },
    {
      challengeId: challenge2.id,
      text: "Correct",
      correct: true,
    },
  ]);
}

async function createMatchPairsChallenges(lessonId: number) {
  console.log("Creating MATCH_PAIRS challenges...");

  // Challenge 1: Programming terms and definitions
  const [challenge1] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "MATCH_PAIRS",
      question: "Match each programming term with its definition",
      order: 1,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    // Pair 1: Variable
    {
      challengeId: challenge1.id,
      text: "Variable",
      correct: false,
      pairId: 1,
    },
    {
      challengeId: challenge1.id,
      text: "Stores data value",
      correct: false,
      pairId: 1,
    },
    // Pair 2: Function
    {
      challengeId: challenge1.id,
      text: "Function",
      correct: false,
      pairId: 2,
    },
    {
      challengeId: challenge1.id,
      text: "Reusable code block",
      correct: false,
      pairId: 2,
    },
    // Pair 3: Loop
    {
      challengeId: challenge1.id,
      text: "Loop",
      correct: false,
      pairId: 3,
    },
    {
      challengeId: challenge1.id,
      text: "Repeats code execution",
      correct: false,
      pairId: 3,
    },
    {
      challengeId: challenge1.id,
      text: "Correct",
      correct: true,
    },
  ]);

  // Challenge 2: Data types matching
  const [challenge2] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "MATCH_PAIRS",
      question: "Match data types with their example values",
      order: 2,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    // Pair 1: String
    {
      challengeId: challenge2.id,
      text: "String",
      correct: false,
      pairId: 1,
    },
    {
      challengeId: challenge2.id,
      text: '"Hello World"',
      correct: false,
      pairId: 1,
    },
    // Pair 2: Number
    {
      challengeId: challenge2.id,
      text: "Number",
      correct: false,
      pairId: 2,
    },
    {
      challengeId: challenge2.id,
      text: "42",
      correct: false,
      pairId: 2,
    },
    // Pair 3: Boolean
    {
      challengeId: challenge2.id,
      text: "Boolean",
      correct: false,
      pairId: 3,
    },
    {
      challengeId: challenge2.id,
      text: "true",
      correct: false,
      pairId: 3,
    },
    {
      challengeId: challenge2.id,
      text: "Correct",
      correct: true,
    },
  ]);
}

async function createSequenceChallenges(lessonId: number) {
  console.log("Creating SEQUENCE challenges...");

  // Challenge 1: Programming workflow
  const [challenge1] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "SEQUENCE",
      question: "Put the programming workflow steps in the correct order",
      order: 1,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    {
      challengeId: challenge1.id,
      text: "Write code",
      correct: false,
      correctOrder: 1,
    },
    {
      challengeId: challenge1.id,
      text: "Test the program",
      correct: false,
      correctOrder: 2,
    },
    {
      challengeId: challenge1.id,
      text: "Debug errors",
      correct: false,
      correctOrder: 3,
    },
    {
      challengeId: challenge1.id,
      text: "Deploy to production",
      correct: false,
      correctOrder: 4,
    },
    {
      challengeId: challenge1.id,
      text: "Correct",
      correct: true,
    },
  ]);

  // Challenge 2: Algorithm steps
  const [challenge2] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "SEQUENCE",
      question: "Order these steps to sort an array using bubble sort",
      order: 2,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    {
      challengeId: challenge2.id,
      text: "Compare adjacent elements",
      correct: false,
      correctOrder: 1,
    },
    {
      challengeId: challenge2.id,
      text: "Swap if in wrong order",
      correct: false,
      correctOrder: 2,
    },
    {
      challengeId: challenge2.id,
      text: "Move to next pair",
      correct: false,
      correctOrder: 3,
    },
    {
      challengeId: challenge2.id,
      text: "Repeat until sorted",
      correct: false,
      correctOrder: 4,
    },
    {
      challengeId: challenge2.id,
      text: "Correct",
      correct: true,
    },
  ]);
}

async function createTimerChallenges(lessonId: number) {
  console.log("Creating TIMER_CHALLENGE challenges...");

  // Challenge 1: Quick math (10 seconds)
  const [challenge1] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "TIMER_CHALLENGE",
      question: "Quick! What is the result of 8 * 7?",
      order: 1,
      timeLimit: 10,
      metadata: JSON.stringify({ baseType: "SELECT" }),
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    {
      challengeId: challenge1.id,
      text: "54",
      correct: false,
    },
    {
      challengeId: challenge1.id,
      text: "56",
      correct: true,
    },
    {
      challengeId: challenge1.id,
      text: "58",
      correct: false,
    },
    {
      challengeId: challenge1.id,
      text: "64",
      correct: false,
    },
  ]);

  // Challenge 2: Programming concepts (15 seconds)
  const [challenge2] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "TIMER_CHALLENGE",
      question: "Speed round! Which keyword is used to declare a variable in JavaScript?",
      order: 2,
      timeLimit: 15,
      metadata: JSON.stringify({ baseType: "SELECT" }),
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    {
      challengeId: challenge2.id,
      text: "var",
      correct: true,
    },
    {
      challengeId: challenge2.id,
      text: "variable",
      correct: false,
    },
    {
      challengeId: challenge2.id,
      text: "declare",
      correct: false,
    },
    {
      challengeId: challenge2.id,
      text: "new",
      correct: false,
    },
  ]);

  // Challenge 3: Timed fill-in-the-blank (20 seconds)
  const [challenge3] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "FILL_BLANK",
      question: "Complete quickly: for(let i = 0; i < 10; i++) { {1}.log(i); }",
      order: 3,
      timeLimit: 20,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    {
      challengeId: challenge3.id,
      text: "console",
      correct: false,
      isBlank: true,
    },
    {
      challengeId: challenge3.id,
      text: "Correct",
      correct: true,
    },
  ]);
}

async function createClassicChallenges(lessonId: number) {
  console.log("Creating classic SELECT and ASSIST challenges...");

  // Challenge 1: SELECT type
  const [challenge1] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "SELECT",
      question: "Which of these is a programming language?",
      order: 1,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    {
      challengeId: challenge1.id,
      text: "HTML",
      correct: false,
    },
    {
      challengeId: challenge1.id,
      text: "CSS",
      correct: false,
    },
    {
      challengeId: challenge1.id,
      text: "JavaScript",
      correct: true,
    },
    {
      challengeId: challenge1.id,
      text: "JSON",
      correct: false,
    },
  ]);

  // Challenge 2: ASSIST type
  const [challenge2] = await db
    .insert(schema.challenges)
    .values({
      lessonId,
      type: "ASSIST",
      question: "A collection of code that performs a specific task",
      order: 2,
    })
    .returning();

  await db.insert(schema.challengeOptions).values([
    {
      challengeId: challenge2.id,
      text: "Variable",
      correct: false,
    },
    {
      challengeId: challenge2.id,
      text: "Function",
      correct: true,
    },
    {
      challengeId: challenge2.id,
      text: "Array",
      correct: false,
    },
    {
      challengeId: challenge2.id,
      text: "String",
      correct: false,
    },
  ]);
}

// Run the script
if (require.main === module) {
  createTestCourse()
    .then(() => {
      console.log("✅ Test course creation completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error creating test course:", error);
      process.exit(1);
    });
}

module.exports = { createTestCourse }; 