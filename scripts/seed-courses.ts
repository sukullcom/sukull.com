import { execSync } from "child_process";
import path from "path";

console.log("Starting to seed all courses...");

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
  // Run the courses in sequence
  runScript("matematik.ts");
  runScript("fizik.ts");
  runScript("kimya.ts");
  runScript("biyoloji.ts");
  runScript("bilgisayar-bilimleri.ts");
  
  console.log("All courses have been successfully seeded!");
}

main().catch((error) => {
  console.error("An error occurred while seeding courses:", error);
  process.exit(1);
}); 