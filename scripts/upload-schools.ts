import "dotenv/config";
import fs from 'fs';
import csv from 'csv-parser';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

// Create a postgres-js client using the DATABASE_URL
const client = postgres(process.env.DATABASE_URL!);

// Initialize drizzle with the client and your schema
const db = drizzle(client, { schema });

const { schools } = schema;

// Function to fix Turkish character encoding
function fixEncoding(text: string): string {
  const replacements: Record<string, string> = {
    'Ã–': 'Ö',
    'Ã‡': 'Ç',
    'Ä°': 'İ',
    'ÅŸ': 'Ş',
    'Ã¼': 'ü',
    'Ä±': 'ı',
    'ÄŸ': 'ğ',
    'Ã¶': 'ö',
    'Ã§': 'ç',
    'ÅŸ': 'ş',
    'Ãœ': 'Ü',
    'Å': 'Ğ',
    'Ä': 'Ğ',
    'ÄŸ': 'ğ',
    'BAÅARI': 'BAŞARI',
    'KOLEJÄ°': 'KOLEJİ',
    'Ã–ZEL': 'ÖZEL',
    'DÃ–ÅKAYA': 'DÖŞKAYA',
    'ÃœNÄ°VERSÄ°TESÄ°': 'ÜNİVERSİTESİ',
    'BAÅKENT': 'BAŞKENT',
    'Ä°LKOKULU': 'İLKOKULU',
    'Ã‡AÄLA': 'ÇAĞLA',
    'Ã‡UKUROVA': 'ÇUKUROVA'
  };

  let fixed = text;
  for (const [wrong, correct] of Object.entries(replacements)) {
    fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
  }
  
  return fixed;
}

// Function to map category to school type enum
function mapCategoryToType(category: string): 'university' | 'high_school' | 'secondary_school' | 'elementary_school' {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('university') || categoryLower.includes('üniversite')) {
    return 'university';
  } else if (categoryLower.includes('high school') || categoryLower.includes('lise') || categoryLower.includes('lisesi')) {
    return 'high_school';
  } else if (categoryLower.includes('secondary') || categoryLower.includes('ortaokul')) {
    return 'secondary_school';
  } else if (categoryLower.includes('primary') || categoryLower.includes('ilkokul')) {
    return 'elementary_school';
  }
  
  // Default fallback based on kind
  const kind = category.toLowerCase();
  if (kind.includes('lise') || kind.includes('lisesi')) {
    return 'high_school';
  } else if (kind.includes('ortaokul')) {
    return 'secondary_school';
  }
  
  // Default to elementary school
  return 'elementary_school';
}

interface CSVRow {
  City: string;
  District: string;
  Category: string;
  Kind: string;
  'School Name': string;
}

async function uploadSchools() {
  console.log('🏫 Starting schools upload...');
  
  const results: CSVRow[] = [];
  const csvPath = 'data/schools_parsed.csv';
  
  // Check if file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  // Read and parse CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath, { encoding: 'utf8' })
      .pipe(csv())
      .on('data', (data: CSVRow) => {
        results.push(data);
      })
      .on('end', () => {
        console.log(`📊 Parsed ${results.length} schools from CSV`);
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
  
  if (results.length === 0) {
    console.log('⚠️ No schools found in CSV file');
    return;
  }
  
  console.log(`🔄 Processing ${results.length} schools...`);
  
  // Process in batches to avoid memory issues
  const batchSize = 1000;
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(results.length / batchSize)} (${batch.length} schools)`);
    
    const schoolsToInsert = batch.map((row) => {
      try {
        const school = {
          name: fixEncoding(row['School Name']).trim(),
          city: fixEncoding(row.City).trim().toUpperCase(),
          district: fixEncoding(row.District).trim(),
          category: fixEncoding(row.Category).trim(),
          kind: row.Kind ? fixEncoding(row.Kind).trim() : null,
          type: mapCategoryToType(row.Category),
          totalPoints: 0,
        };
        
        // Validate required fields
        if (!school.name || !school.city || !school.district || !school.category) {
          console.warn(`⚠️ Skipping school with missing data:`, row);
          failed++;
          return null;
        }
        
        successful++;
        return school;
      } catch (error) {
        console.error(`❌ Error processing school:`, row, error);
        failed++;
        return null;
      }
    }).filter(Boolean);
    
    // Insert batch into database
    if (schoolsToInsert.length > 0) {
      try {
        await db.insert(schools).values(schoolsToInsert);
        processed += schoolsToInsert.length;
        console.log(`✅ Inserted ${schoolsToInsert.length} schools (Total: ${processed})`);
      } catch (error) {
        console.error(`❌ Error inserting batch:`, error);
        failed += schoolsToInsert.length;
      }
    }
  }
  
  console.log('\n📈 Upload Summary:');
  console.log(`✅ Successfully processed: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total inserted: ${processed}`);
  
  // Verify the upload
  const totalInDB = await db.select().from(schools);
  console.log(`🔍 Total schools in database: ${totalInDB.length}`);
  
  // Show sample of uploaded schools
  const sampleSchools = totalInDB.slice(0, 5);
  console.log('\n📋 Sample uploaded schools:');
  sampleSchools.forEach((school, index) => {
    console.log(`${index + 1}. ${school.name} - ${school.city}/${school.district} (${school.type})`);
  });
}

// Run the upload
uploadSchools()
  .then(() => {
    console.log('\n🎉 Schools upload completed!');
  })
  .catch((error) => {
    console.error('\n💥 Upload failed:', error);
  })
  .finally(async () => {
    // Close the database connection
    await client.end();
    process.exit(0);
  }); 