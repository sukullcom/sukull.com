import { execSync } from "child_process";
import path from "path";

console.log("Starting to seed all courses for grades 5-8...");

const runScript = (scriptName: string) => {
  try {
    console.log(`Running ${scriptName}...`);
    execSync(`npx tsx ${path.join(__dirname, scriptName)}`, { stdio: 'inherit' });
    console.log(`Successfully completed ${scriptName}`);
  } catch (error) {
    console.error(`Error running ${scriptName}:`, error);
    process.exit(1);
  }
};

// Run each course script in sequence
async function main() {
  // // 5th Grade
  console.log("=== SEEDING 5TH GRADE COURSES ===");
  runScript("matematik-5.ts");
  // runScript("fizik-5.ts");
  // runScript("kimya-5.ts");
  // runScript("biyoloji-5.ts");
  // runScript("bilgisayar-bilimleri-5.ts");
  
  // // 6th Grade
  // console.log("=== SEEDING 6TH GRADE COURSES ===");
  // runScript("matematik-6.ts");
  // runScript("fizik-6.ts");
  // runScript("kimya-6.ts");
  // runScript("biyoloji-6.ts");
  // runScript("bilgisayar-bilimleri-6.ts");
  
  // // 7th Grade
  // console.log("=== SEEDING 7TH GRADE COURSES ===");
  // runScript("matematik-7.ts");
  // runScript("fizik-7.ts");
  // runScript("kimya-7.ts");
  // runScript("biyoloji-7.ts");
  // runScript("bilgisayar-bilimleri-7.ts");
  
  // // 8th Grade
  // console.log("=== SEEDING 8TH GRADE COURSES ===");
  // runScript("matematik-8.ts");
  // runScript("fizik-8.ts");
  // runScript("kimya-8.ts");
  // runScript("biyoloji-8.ts");
  // runScript("bilgisayar-bilimleri-8.ts");
  
  console.log("All courses for grades 5-8 have been successfully seeded!");
}

main().catch((error) => {
  console.error("An error occurred while seeding courses:", error);
  process.exit(1);
}); 