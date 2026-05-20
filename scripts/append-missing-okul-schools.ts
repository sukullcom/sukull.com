/**
 * okul.com.tr eksik listesini schools_parsed.csv'ye ekler (anaokulu hariç).
 *
 *   npm run schools:append-missing        # dry-run
 *   npm run schools:append-missing -- --write
 */
import fs from "fs";
import path from "path";

import { normalizeDistrictName, normalizeMatchKey } from "../lib/school-data-normalize";

type MissingEntry = {
  name: string;
  district: string;
  levels: string[];
  city?: string;
};

type CsvRow = {
  city: string;
  district: string;
  category: string;
  kind: string;
  schoolName: string;
};

const LEVEL_META: Record<
  string,
  { category: string; kind: string; suffix: string }
> = {
  ilkokul: { category: "Primary School", kind: "Özel İlkokul", suffix: "İLKOKULU" },
  ortaokul: { category: "Secondary School", kind: "Özel Ortaokul", suffix: "ORTAOKULU" },
  lise: { category: "High School", kind: "Anadolu Lisesi", suffix: "ANADOLU LİSESİ" },
};

function loadMissingEntries(dataDir: string): MissingEntry[] {
  const out: MissingEntry[] = [];

  const regionsPath = path.join(dataDir, "okul-com-tr-missing-regions.json");
  if (fs.existsSync(regionsPath)) {
    const regions = JSON.parse(fs.readFileSync(regionsPath, "utf-8")) as {
      cities: Array<{ city: string; missing: MissingEntry[] }>;
    };
    for (const c of regions.cities) {
      for (const m of c.missing) {
        out.push({ ...m, city: c.city });
      }
    }
  }

  const istanbulPath = path.join(dataDir, "okul-com-tr-missing-istanbul.json");
  if (fs.existsSync(istanbulPath)) {
    const istanbul = JSON.parse(fs.readFileSync(istanbulPath, "utf-8")) as {
      missing: MissingEntry[];
    };
    for (const m of istanbul.missing) {
      out.push({ ...m, city: "İSTANBUL" });
    }
  }

  return out;
}

function filterLevels(levels: string[]): string[] {
  return levels.filter((l) => l !== "anaokulu");
}

function resolveLiseKind(displayName: string): { kind: string; suffix: string } {
  const n = displayName.toLocaleLowerCase("tr-TR");
  if (/mesleki|teknik/.test(n)) {
    return {
      kind: "Mesleki ve Teknik Anadolu Lisesi",
      suffix: "MESLEKİ VE TEKNİK ANADOLU LİSESİ",
    };
  }
  if (/fen\s|fen bilimleri/.test(n)) {
    return { kind: "Fen Lisesi", suffix: "FEN LİSESİ" };
  }
  if (/imam hatip/.test(n)) {
    return { kind: "İmam Hatip Lisesi", suffix: "İMAM HATİP LİSESİ" };
  }
  if (/anadolu/.test(n)) {
    return { kind: "Anadolu Lisesi", suffix: "ANADOLU LİSESİ" };
  }
  return { kind: "Anadolu Lisesi", suffix: "LİSESİ" };
}

function toSchoolBaseName(displayName: string): string {
  let base = displayName
    .replace(/-logo$/i, "")
    .replace(/\s+Kampüsü$/i, "")
    .trim()
    .toLocaleUpperCase("tr-TR");

  if (!base.startsWith("ÖZEL ")) {
    if (/^ÖZEL\s/i.test(displayName)) base = displayName.toLocaleUpperCase("tr-TR");
    else base = `ÖZEL ${base}`;
  }

  return base.replace(/\s+/g, " ").trim();
}

export function missingEntryToCsvRows(entry: MissingEntry): CsvRow[] {
  const levels = filterLevels(entry.levels);
  if (levels.length === 0) return [];

  const city = (entry.city ?? "İSTANBUL").toLocaleUpperCase("tr-TR");
  const district = normalizeDistrictName(entry.district.trim(), city);
  const base = toSchoolBaseName(entry.name);
  const rows: CsvRow[] = [];

  for (const lv of levels) {
    const meta = LEVEL_META[lv];
    if (!meta) continue;

    let kind = meta.kind;
    let suffix = meta.suffix;
    if (lv === "lise") {
      const lise = resolveLiseKind(entry.name);
      kind = lise.kind;
      suffix = lise.suffix;
    }

    const schoolName = `${base} ${suffix}`.replace(/\s+/g, " ").trim();

    rows.push({
      city,
      district,
      category: meta.category,
      kind,
      schoolName,
    });
  }

  return rows;
}

function rowKey(r: CsvRow): string {
  return [
    r.city,
    fold(r.district),
    r.category,
    normalizeMatchKey(r.schoolName),
  ].join("\0");
}

function fold(s: string): string {
  return s.toLocaleUpperCase("tr-TR");
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') inQ = !inQ;
    else if (c === "," && !inQ) {
      result.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  result.push(cur.trim());
  return result;
}

function toCsvLine(r: CsvRow): string {
  const esc = (s: string) => (s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s);
  return [r.city, r.district, r.category, r.kind, r.schoolName].map(esc).join(",");
}

function main(): void {
  const write = process.argv.includes("--write");
  const dataDir = path.join(process.cwd(), "data");
  const csvPath = path.join(dataDir, "schools_parsed.csv");

  const missing = loadMissingEntries(dataDir);
  const proposed: CsvRow[] = [];

  for (const m of missing) {
    proposed.push(...missingEntryToCsvRows(m));
  }

  const existingKeys = new Set<string>();
  const existingLines = fs.readFileSync(csvPath, "utf-8").split(/\r?\n/);
  const header = existingLines[0]!;
  for (const line of existingLines.slice(1)) {
    if (!line.trim()) continue;
    const [city, district, category, kind, schoolName] = parseCsvLine(line);
    if (!schoolName) continue;
    existingKeys.add(
      rowKey({
        city: city!.toLocaleUpperCase("tr-TR"),
        district: district!,
        category: category!,
        kind: kind ?? "",
        schoolName,
      }),
    );
  }

  const toAdd: CsvRow[] = [];
  const seenNew = new Set<string>();
  for (const r of proposed) {
    const k = rowKey(r);
    if (existingKeys.has(k) || seenNew.has(k)) continue;
    seenNew.add(k);
    toAdd.push(r);
  }

  console.log(`Eksik kayıt (kurum): ${missing.length}`);
  console.log(`Üretilen CSV satırı: ${proposed.length}`);
  console.log(`Zaten var (atlandı): ${proposed.length - toAdd.length}`);
  console.log(`Eklenecek yeni satır: ${toAdd.length}\n`);

  const byCity = new Map<string, number>();
  for (const r of toAdd) {
    byCity.set(r.city, (byCity.get(r.city) ?? 0) + 1);
  }
  for (const [city, n] of [...byCity.entries()].sort((a, b) => a[0].localeCompare(b[0], "tr"))) {
    console.log(`  ${city}: +${n}`);
  }

  if (toAdd.length > 0 && toAdd.length <= 30) {
    console.log("\nÖrnek eklemeler:");
    for (const r of toAdd.slice(0, 10)) {
      console.log(`  ${r.city}/${r.district} | ${r.category} | ${r.schoolName}`);
    }
  }

  if (!write) {
    console.log("\nDry-run. Uygulamak için:\n  npm run schools:append-missing -- --write\n");
    return;
  }

  const newContent = [
    header,
    ...existingLines.slice(1).filter((l) => l.trim()),
    ...toAdd.map(toCsvLine),
  ].join("\n") + "\n";

  fs.writeFileSync(csvPath, newContent, "utf-8");
  console.log(`\nGüncellendi: ${csvPath} (+${toAdd.length} satır)`);
  console.log("DB: npm run schools:import\n");
}

main();
