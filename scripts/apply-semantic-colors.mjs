/**
 * One-off: replace common Tailwind gray/neutral/slate/zinc + bg-white
 * with semantic tokens. Skips admin + snake-game.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIRS = ["app", "components"];
const SKIP = new Set([
  "snake-game.tsx",
  "apply-semantic-colors.mjs",
]);

const REPLACEMENTS = [
  [/text-gray-900\b/g, "text-foreground"],
  [/text-neutral-900\b/g, "text-foreground"],
  [/text-slate-900\b/g, "text-foreground"],
  [/text-zinc-900\b/g, "text-foreground"],
  [/text-gray-800\b/g, "text-foreground"],
  [/text-neutral-800\b/g, "text-foreground"],
  [/text-slate-800\b/g, "text-foreground"],
  [/text-zinc-800\b/g, "text-foreground"],
  [/text-gray-700\b/g, "text-foreground"],
  [/text-neutral-700\b/g, "text-foreground"],
  [/text-slate-700\b/g, "text-foreground"],
  [/text-zinc-700\b/g, "text-foreground"],
  [/text-gray-600\b/g, "text-muted-foreground"],
  [/text-neutral-600\b/g, "text-muted-foreground"],
  [/text-slate-600\b/g, "text-muted-foreground"],
  [/text-zinc-600\b/g, "text-muted-foreground"],
  [/text-gray-500\b/g, "text-muted-foreground"],
  [/text-neutral-500\b/g, "text-muted-foreground"],
  [/text-slate-500\b/g, "text-muted-foreground"],
  [/text-zinc-500\b/g, "text-muted-foreground"],
  [/text-gray-400\b/g, "text-muted-foreground"],
  [/text-neutral-400\b/g, "text-muted-foreground"],
  [/text-slate-400\b/g, "text-muted-foreground"],
  [/text-zinc-400\b/g, "text-muted-foreground"],
  [/text-gray-300\b/g, "text-muted-foreground"],
  [/text-neutral-300\b/g, "text-muted-foreground"],
  [/text-slate-300\b/g, "text-muted-foreground"],
  [/text-zinc-300\b/g, "text-muted-foreground"],
  [/border-gray-200\b/g, "border-border"],
  [/border-neutral-200\b/g, "border-border"],
  [/border-slate-200\b/g, "border-border"],
  [/border-zinc-200\b/g, "border-border"],
  [/border-gray-300\b/g, "border-input"],
  [/border-neutral-300\b/g, "border-input"],
  [/border-slate-300\b/g, "border-input"],
  [/border-zinc-300\b/g, "border-input"],
  [/bg-gray-50\b/g, "bg-muted"],
  [/bg-neutral-50\b/g, "bg-muted"],
  [/bg-slate-50\b/g, "bg-muted"],
  [/bg-zinc-50\b/g, "bg-muted"],
  [/bg-gray-100\b/g, "bg-muted"],
  [/bg-neutral-100\b/g, "bg-muted"],
  [/bg-slate-100\b/g, "bg-muted"],
  [/bg-zinc-100\b/g, "bg-muted"],
  [/hover:bg-gray-100\b/g, "hover:bg-muted"],
  [/hover:bg-neutral-100\b/g, "hover:bg-muted"],
  [/hover:bg-slate-100\b/g, "hover:bg-muted"],
  [/hover:text-gray-900\b/g, "hover:text-foreground"],
  [/hover:text-neutral-900\b/g, "hover:text-foreground"],
  [/hover:text-gray-800\b/g, "hover:text-foreground"],
  [/hover:text-neutral-800\b/g, "hover:text-foreground"],
  [/hover:text-gray-700\b/g, "hover:text-foreground"],
  [/hover:text-neutral-700\b/g, "hover:text-foreground"],
  [/ring-offset-white\b/g, "ring-offset-background"],
  [/ring-offset-gray-50\b/g, "ring-offset-background"],
];

/** bg-white → bg-card (avoid inside marketing if needed) */
const BG_WHITE = /\bbg-white\b/g;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      if (full.includes(`${path.sep}admin${path.sep}`)) continue;
      walk(full, files);
    } else if (name.endsWith(".tsx") || name.endsWith(".ts")) {
      if (SKIP.has(name)) continue;
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const dir of DIRS) {
  const files = walk(path.join(ROOT, dir));
  for (const file of files) {
    let s = fs.readFileSync(file, "utf8");
    const orig = s;
    for (const [re, rep] of REPLACEMENTS) {
      s = s.replace(re, rep);
    }
    if (!file.includes(`${path.sep}study-buddy${path.sep}`)) {
      s = s.replace(BG_WHITE, "bg-card");
    }
    if (s !== orig) {
      fs.writeFileSync(file, s, "utf8");
      changed++;
    }
  }
}
console.log("Updated files:", changed);
