/**
 * schools_parsed.csv — şehir/ilçe normalizasyonu (dry-run varsayılan).
 *
 *   npm run schools:normalize
 *   npm run schools:normalize -- --write
 */
import fs from "fs";
import path from "path";

import {
  normalizeSchoolCsvRows,
  type SchoolCsvRow,
} from "../lib/school-data-normalize";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function toCsvLine(row: SchoolCsvRow): string {
  const esc = (s: string) => (s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s);
  return [row.city, row.district, row.category, row.kind, row.schoolName]
    .map(esc)
    .join(",");
}

function main(): void {
  const write = process.argv.includes("--write");
  const csvPath = path.join(process.cwd(), "data", "schools_parsed.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  const header = lines[0]!;
  const dataLines = lines.slice(1);

  const rows: SchoolCsvRow[] = [];
  for (const line of dataLines) {
    const [city, district, category, kind, schoolName] = parseCSVLine(line);
    if (!city || !district || !category || !schoolName) continue;
    rows.push({
      city,
      district,
      category,
      kind: kind ?? "",
      schoolName,
    });
  }

  const { rows: normalized, cityFixes, districtMerges } = normalizeSchoolCsvRows(rows);

  console.log(`Satır: ${normalized.length}`);
  console.log(`Üniversite şehir düzeltmesi: ${cityFixes}`);
  console.log(`İlçe birleştirme (yazım): ${districtMerges}`);

  if (!write) {
    console.log("\nDry-run. CSV güncellemek için:\n  npm run schools:normalize -- --write\n");
    return;
  }

  const out = [header, ...normalized.map(toCsvLine)].join("\n") + "\n";
  fs.writeFileSync(csvPath, out, "utf-8");
  console.log(`\nYazıldı: ${csvPath}`);
  console.log("DB güncellemek için: npm run schools:import (veya schools:upload)\n");
}

main();
