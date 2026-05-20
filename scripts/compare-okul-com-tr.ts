/**
 * okul.com.tr kolej listesi ↔ schools_parsed.csv karşılaştırması.
 * Anaokulu hariç (sadece anaokul olan kampüsler elenir).
 *
 *   npm run schools:compare-okul -- path/to/ankara-kolejleri.md path/to/izmir...
 *   npm run schools:compare-okul -- --all-regions
 */
import fs from "fs";
import path from "path";

import { foldDistrictKey, normalizeMatchKey } from "../lib/school-data-normalize";

const OKUL_CITY_PATTERN =
  "İstanbul|Istanbul|Ankara|İzmir|Izmir|Antalya|Bursa|Kocaeli|Adana|Mersin";

type ExternalSchool = {
  name: string;
  city: string;
  district: string;
  levels: string[];
};

type CsvSchool = {
  name: string;
  district: string;
  category: string;
};

const LEVEL_TO_CATEGORY: Record<string, string> = {
  ilkokul: "Primary School",
  ortaokul: "Secondary School",
  lise: "High School",
};

const DEFAULT_REGION_FILES: { slug: string; file: string }[] = [
  { slug: "ankara", file: "ankara-kolejleri-0.md" },
  { slug: "izmir", file: "izmir-kolejleri-1.md" },
  { slug: "antalya", file: "antalya-kolejleri-2.md" },
  { slug: "bursa", file: "bursa-kolejleri-3.md" },
  { slug: "kocaeli", file: "kocaeli-kolejleri-4.md" },
  { slug: "adana", file: "adana-kolejleri-5.md" },
  { slug: "mersin", file: "mersin-kolejleri-6.md" },
];

function normalizeLevel(raw: string): string | null {
  const lv = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\u0307/g, "")
    .replace(/ı/g, "i");
  if (lv === "anaokulu") return null;
  if (lv === "ilkokul" || lv === "ortaokul" || lv === "lise") return lv;
  return null;
}

function parseLocationLine(line: string): { city: string; district: string } | null {
  const m = line.match(new RegExp(`^\\s*(${OKUL_CITY_PATTERN})\\s*\\/\\s*(.+)$`, "i"));
  if (!m) return null;
  return {
    city: m[1]!.trim().toLocaleUpperCase("tr-TR"),
    district: m[2]!.trim(),
  };
}

function isLocationLine(line: string): boolean {
  return parseLocationLine(line) !== null;
}

function isBadSchoolName(cand: string): boolean {
  if (!cand || cand.length <= 3) return true;
  if (/^kolejleri listele$/i.test(cand)) return true;
  const low = cand.toLocaleLowerCase("tr-TR");
  if (["şehir", "ilçe", "anasayfa", "kolej", "kolejler"].includes(low)) return true;
  if (/^comment-icon|^announcement|^%|^\*\*/.test(cand)) return true;
  if (/^(Anaokulu|İlkokul|Ortaokul|Lise)$/i.test(cand)) return true;
  return false;
}

function pickSchoolNameNear(lines: string[], locIndex: number): string {
  for (let j = locIndex - 1; j >= Math.max(0, locIndex - 4); j--) {
    const cand = lines[j] ?? "";
    if (isBadSchoolName(cand) || isLocationLine(cand)) continue;
    if (/^(Anaokulu|İlkokul|Ortaokul|Lise|Fen|Anadolu)/i.test(cand) && cand.length < 40) {
      continue;
    }
    return cand;
  }
  for (let j = locIndex + 1; j <= Math.min(lines.length - 1, locIndex + 3); j++) {
    const cand = lines[j] ?? "";
    if (isBadSchoolName(cand) || isLocationLine(cand)) continue;
    return cand;
  }
  return "";
}

export function parseExternalMarkdown(content: string): ExternalSchool[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim());
  const schools: ExternalSchool[] = [];

  for (let i = 0; i < lines.length; i++) {
    const loc = parseLocationLine(lines[i] ?? "");
    if (!loc) continue;

    let name = pickSchoolNameNear(lines, i);

    const levels: string[] = [];
    for (let k = i + 1; k < Math.min(lines.length, i + 30); k++) {
      const row = lines[k] ?? "";
      if (isLocationLine(row)) break;
      const lv = row.match(/^(Anaokulu|İlkokul|Ortaokul|Lise)$/i);
      if (lv) {
        const n = normalizeLevel(lv[1]!);
        if (n) levels.push(n);
      }
      if (row && !lv && levels.length > 0 && row.length > 8 && !row.includes("Yorum")) {
        break;
      }
    }

    name = name.replace(/-logo$/i, "").trim();
    if (name.length <= 3 || levels.length === 0) continue;

    const existing = schools.find(
      (s) =>
        s.name === name &&
        s.city === loc.city &&
        foldDistrictKey(s.district) === foldDistrictKey(loc.district),
    );
    if (!existing) {
      schools.push({
        name,
        city: loc.city,
        district: loc.district,
        levels: [...new Set(levels)],
      });
    } else {
      existing.levels = [...new Set([...existing.levels, ...levels])];
    }
  }

  return schools;
}

function tokenSet(key: string): Set<string> {
  return new Set(
    key
      .split(" ")
      .map((t) => t.trim())
      .filter((t) => t.length > 1),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function loadCityCsv(csvPath: string, cityUpper: string): CsvSchool[] {
  const text = fs.readFileSync(csvPath, "utf-8");
  const rows: CsvSchool[] = [];
  for (const line of text.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const parts = parseCsvLine(line);
    const [city, district, category, kind, schoolName] = parts;
    if (city?.toLocaleUpperCase("tr-TR") !== cityUpper || !schoolName) continue;
    if (!/özel|kolej/i.test(schoolName) && !/özel|kolej/i.test(kind ?? "")) continue;
    rows.push({
      name: schoolName,
      district: district ?? "",
      category: category ?? "",
    });
  }
  return rows;
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

type MatchResult = {
  external: ExternalSchool;
  matched: boolean;
  score: number;
  csvHits: CsvSchool[];
  missingLevels: string[];
};

function findMatches(external: ExternalSchool, csvRows: CsvSchool[]): MatchResult {
  const extKey = normalizeMatchKey(external.name);
  const extTokens = tokenSet(extKey);
  const extDistrict = foldDistrictKey(external.district);

  const candidates = csvRows.filter((r) => foldDistrictKey(r.district) === extDistrict);

  const hits: { row: CsvSchool; score: number }[] = [];
  for (const row of candidates) {
    const rowKey = normalizeMatchKey(row.name);
    const score = jaccard(extTokens, tokenSet(rowKey));
    const contains =
      rowKey.includes(extKey.slice(0, Math.min(12, extKey.length))) ||
      extKey.includes(rowKey.slice(0, Math.min(12, rowKey.length)));
    const brandHit =
      extKey.length >= 6 &&
      (rowKey.includes(extKey) ||
        extKey.includes(rowKey) ||
        (extKey.split(" ")[0]!.length >= 4 && rowKey.startsWith(extKey.split(" ")[0]!)));

    if (score >= 0.3 || (score >= 0.18 && contains) || brandHit) {
      hits.push({ row, score: brandHit ? Math.max(score, 0.5) : score });
    }
  }

  hits.sort((a, b) => b.score - a.score);

  const bestScore = hits[0]?.score ?? 0;
  const matched = bestScore >= 0.3;

  const missingLevels: string[] = [];
  if (matched && external.levels.length > 0) {
    const hitCategories = new Set(hits.map((h) => h.row.category));
    for (const lv of external.levels) {
      const cat = LEVEL_TO_CATEGORY[lv];
      if (cat && !hitCategories.has(cat)) missingLevels.push(lv);
    }
  }

  return {
    external,
    matched,
    score: bestScore,
    csvHits: hits.slice(0, 3).map((h) => h.row),
    missingLevels,
  };
}

type CityReport = {
  city: string;
  source: string;
  externalCount: number;
  csvPrivateCount: number;
  matched: number;
  missing: Array<{
    name: string;
    district: string;
    levels: string[];
    bestScore: number;
    nearestCsv: string | null;
  }>;
  partial: Array<{
    name: string;
    district: string;
    levels: string[];
    missingLevels: string[];
    csvMatches: string[];
  }>;
};

function compareRegion(mdPath: string, csvPath: string, expectedCity?: string): CityReport {
  const raw = parseExternalMarkdown(fs.readFileSync(mdPath, "utf-8"));
  const city =
    expectedCity ??
    raw[0]?.city ??
    parseLocationLine(fs.readFileSync(mdPath, "utf-8").split(/\r?\n/).find((l) => isLocationLine(l.trim()))?.trim() ?? "")?.city ??
    "UNKNOWN";

  const csvRows = loadCityCsv(csvPath, city);
  const results = raw.map((e) => findMatches(e, csvRows));
  const missing = results.filter((r) => !r.matched);
  const partial = results.filter((r) => r.matched && r.missingLevels.length > 0);

  return {
    city,
    source: mdPath,
    externalCount: raw.length,
    csvPrivateCount: csvRows.length,
    matched: results.length - missing.length,
    missing: missing.map((r) => ({
      name: r.external.name,
      district: r.external.district,
      levels: r.external.levels,
      bestScore: r.score,
      nearestCsv: r.csvHits[0]?.name ?? null,
    })),
    partial: partial.map((r) => ({
      name: r.external.name,
      district: r.external.district,
      levels: r.external.levels,
      missingLevels: r.missingLevels,
      csvMatches: r.csvHits.map((h) => h.name),
    })),
  };
}

function printReport(report: CityReport): void {
  console.log(`\n=== ${report.city} ===`);
  console.log(`okul.com.tr (anaokul hariç): ${report.externalCount} kampüs`);
  console.log(`CSV özel/kolej: ${report.csvPrivateCount}`);
  console.log(`Eşleşen: ${report.matched}`);
  console.log(`Listemizde yok: ${report.missing.length}`);
  console.log(`Kısmen (kademe eksik): ${report.partial.length}`);
  if (report.missing.length > 0 && report.missing.length <= 25) {
    for (const m of report.missing) {
      console.log(`  • ${m.name} (${m.district}) [${m.levels.join(", ")}]`);
    }
  } else if (report.missing.length > 25) {
    for (const m of report.missing.slice(0, 15)) {
      console.log(`  • ${m.name} (${m.district})`);
    }
    console.log(`  … +${report.missing.length - 15} (JSON’da tam liste)`);
  }
}

function main(): void {
  const csvPath = path.join(process.cwd(), "data", "schools_parsed.csv");

  const cityMap: Record<string, string> = {
    ankara: "ANKARA",
    izmir: "İZMİR",
    antalya: "ANTALYA",
    bursa: "BURSA",
    kocaeli: "KOCAELİ",
    adana: "ADANA",
    mersin: "MERSİN",
  };

  function resolveUploadsDir(): string {
    const candidates = [
      path.join(process.cwd(), "uploads"),
      path.join(process.cwd(), "..", ".cursor", "projects", "c-src-FlutterProjects", "uploads"),
      "C:\\Users\\savle\\.cursor\\projects\\c-src-FlutterProjects\\uploads",
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return candidates[0]!;
  }

  let mdPaths: { path: string; city?: string }[] = [];

  if (process.argv.includes("--all-regions")) {
    const uploadsDir = resolveUploadsDir();
    mdPaths = DEFAULT_REGION_FILES.filter((f) =>
      fs.existsSync(path.join(uploadsDir, f.file)),
    ).map((f) => ({
      path: path.join(uploadsDir, f.file),
      city: cityMap[f.slug],
    }));
  } else {
    const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
    if (args.length === 0) {
      console.error(
        "Kullanım: npm run schools:compare-okul -- --all-regions\n" +
          "   veya: npm run schools:compare-okul -- path/to/ankara-kolejleri.md ...",
      );
      process.exit(1);
    }
    mdPaths = args.map((p) => ({ path: path.resolve(p) }));
  }

  const reports: CityReport[] = [];
  for (const { path: mdPath, city } of mdPaths) {
    if (!fs.existsSync(mdPath)) {
      console.error(`MD bulunamadı: ${mdPath}`);
      continue;
    }
    const report = compareRegion(mdPath, csvPath, city);
    printReport(report);
    reports.push(report);
  }

  const isMultiRegion = process.argv.includes("--all-regions") || mdPaths.length > 1;

  if (isMultiRegion) {
    const outPath = path.join(process.cwd(), "data", "okul-com-tr-missing-regions.json");
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          csv: csvPath,
          note: "Anaokulu hariç; sadece anaokul olan kampüsler parse aşamasında elendi.",
          generatedAt: new Date().toISOString(),
          cities: reports,
          totals: {
            external: reports.reduce((s, r) => s + r.externalCount, 0),
            matched: reports.reduce((s, r) => s + r.matched, 0),
            missing: reports.reduce((s, r) => s + r.missing.length, 0),
            partial: reports.reduce((s, r) => s + r.partial.length, 0),
          },
        },
        null,
        2,
      ),
      "utf-8",
    );
    console.log("\n--- Özet (çoklu il) ---");
    console.log(
      `Kampüs: ${reports.reduce((s, r) => s + r.externalCount, 0)} | Eşleşen: ${reports.reduce((s, r) => s + r.matched, 0)} | Yok: ${reports.reduce((s, r) => s + r.missing.length, 0)} | Kısmen: ${reports.reduce((s, r) => s + r.partial.length, 0)}`,
    );
    console.log(`Detay: ${outPath}\n`);
  } else {
    console.log("");
  }

  for (const r of reports) {
    const slug = r.city
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/İ/g, "i");
    const perCityPath = path.join(process.cwd(), "data", `okul-com-tr-missing-${slug}.json`);
    fs.writeFileSync(perCityPath, JSON.stringify(r, null, 2), "utf-8");
    if (!isMultiRegion) {
      console.log(`Detay: ${perCityPath}\n`);
    }
  }
}

const isDirectRun = process.argv[1]?.includes("compare-okul-com-tr");
if (isDirectRun) main();
