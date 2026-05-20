require("dotenv/config");
const { drizzle } = require("drizzle-orm/postgres-js");
const postgres = require("postgres");
const fs = require("fs");
const path = require("path");

// Create a postgres-js client using the DATABASE_URL
const client = postgres(process.env.DATABASE_URL);

// Initialize drizzle
const { eq, sql } = require("drizzle-orm");

// Type mapping from CSV categories to our enum values
const categoryToTypeMapping = {
  "Primary School": "elementary_school",
  "Secondary School": "secondary_school", 
  "High School": "high_school",
  "University": "university"
};

// Function to fix Turkish character encoding
function fixTurkishEncoding(text) {
  if (!text) return text;
  
  const replacements = {
    'Ä°': 'İ',
    'Ã¶': 'ö',
    'Ã¼': 'ü',
    'Ã§': 'ç',
    'Ä±': 'ı',
    'ÅŸ': 'ş',
    'Ä': 'Ğ',
    'Ã': 'Ğ',
    'Å': 'Ş',
    'Ã–': 'Ö',
    'Ãœ': 'Ü',
    'Ã‡': 'Ç',
    'Å ': 'Ş',
    'Åžehit': 'Şehit',
    'Åahin': 'Şahin',
    'SiviÅŸli': 'Sivişli',
    'KÄ±ÅŸlak': 'Kışlak',
    'KÄ±zÄ±ldam': 'Kızıldam',
    'SinanpaÅŸa': 'Sinanpaşa',
    'AyÅŸe': 'Ayşe',
    'BÃ¼yÃ¼ksofulu': 'Büyüksofulu',
    'AtatÃ¼rk': 'Atatürk',
    'Necati Ã–zsÄ±rkÄ±ntÄ±': 'Necati Özsırkıntı',
    'YÄ±ldÄ±rÄ±m': 'Yıldırım',
    'YÄ±l': 'Yıl',
    'TOKÄ°': 'TOKİ',
    'ALADAÄ': 'ALADAG'
  };

  let result = text;
  for (const [wrong, correct] of Object.entries(replacements)) {
    result = result.replace(new RegExp(wrong, 'g'), correct);
  }
  
  return result;
}

// Function to parse CSV line respecting quotes
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function importSchools() {
  try {
    console.log("🚀 Starting school import process...");
    
    // First, clear existing schools to avoid conflicts
    console.log("🧹 Clearing existing schools...");
    await client`DELETE FROM schools`;
    
    // Read the CSV file
    const csvPath = path.join(process.cwd(), "data", "schools_parsed.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");
    
    console.log(`📄 Found ${lines.length} lines in CSV file`);
    
    // Skip header and filter out empty lines
    const dataLines = lines.slice(1).filter((line) => line.trim().length > 0);
    console.log(`📊 Processing ${dataLines.length} school records`);
    
    // Process schools in batches
    const batchSize = 500;
    let totalImported = 0;
    let errors = 0;
    
    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);
      const schoolsToInsert = [];
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dataLines.length / batchSize)}`);
      
      for (const line of batch) {
        try {
          const [city, district, category, kind, schoolName] = parseCSVLine(line);
          
          if (!city || !district || !category || !schoolName) {
            console.warn(`⚠️  Skipping invalid line: ${line.substring(0, 100)}...`);
            errors++;
            continue;
          }
          
          // Fix encoding issues
          const fixedCity = fixTurkishEncoding(city).toUpperCase();
          const fixedDistrict = fixTurkishEncoding(district).toUpperCase();
          const fixedCategory = fixTurkishEncoding(category);
          const fixedKind = kind ? fixTurkishEncoding(kind) : null;
          const fixedSchoolName = fixTurkishEncoding(schoolName);
          
          // Map category to our enum type
          const mappedType = categoryToTypeMapping[fixedCategory];
          if (!mappedType) {
            console.warn(`⚠️  Unknown category: ${fixedCategory} for school: ${fixedSchoolName}`);
            errors++;
            continue;
          }
          
          schoolsToInsert.push({
            name: fixedSchoolName,
            city: fixedCity,
            district: fixedDistrict,
            category: fixedCategory,
            kind: fixedKind,
            type: mappedType,
            total_points: 0
          });
          
        } catch (error) {
          console.error(`❌ Error processing line: ${line.substring(0, 100)}...`, error);
          errors++;
        }
      }
      
      // Insert batch into database
      if (schoolsToInsert.length > 0) {
        try {
          // Use PostgreSQL's INSERT with VALUES syntax
          const placeholders = schoolsToInsert.map((_, index) => {
            const offset = index * 7; // 7 fields per school
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
          }).join(', ');
          
          const values = schoolsToInsert.flatMap(school => [
            school.name,
            school.city,
            school.district,
            school.category,
            school.kind,
            school.type,
            school.total_points
          ]);
          
          await client`
            INSERT INTO schools (name, city, district, category, kind, type, total_points)
            VALUES ${client(schoolsToInsert.map(school => [
              school.name,
              school.city,
              school.district,
              school.category,
              school.kind,
              school.type,
              school.total_points
            ]))}
          `;
          
          totalImported += schoolsToInsert.length;
          console.log(`✅ Imported batch: ${schoolsToInsert.length} schools`);
        } catch (dbError) {
          console.error(`❌ Database error for batch:`, dbError);
          errors += schoolsToInsert.length;
        }
      }
      
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Import completed!`);
    console.log(`📈 Total imported: ${totalImported} schools`);
    console.log(`❌ Total errors: ${errors}`);
    
    console.log("✅ School import completed successfully!");
    console.log(
      "\nCanlı/Vercel okul listesi önbelleği: deploy sonrası güncellenir veya",
      "okul master cache tag (schools-master) revalidate edilir.\n",
    );
    
  } catch (error) {
    console.error("💥 Import failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importSchools();
}

module.exports = importSchools; 