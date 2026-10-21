import fs from "fs";
import path from "path";

import { normalizeTr } from "@/lib/marketplace/search";

export type District = { id: number; name: string };
export type Province = { id: number; name: string; districts: District[] };

let provincesCache: Province[] | null = null;

export function getProvinces(): Province[] {
  if (provincesCache) return provincesCache;
  const file = path.join(process.cwd(), "data/tr/provinces.json");
  provincesCache = JSON.parse(fs.readFileSync(file, "utf8")) as Province[];
  return provincesCache;
}

export function getNeighborhoods(provinceId: number, districtId: number): string[] {
  if (!Number.isInteger(provinceId) || !Number.isInteger(districtId)) return [];
  const file = path.join(process.cwd(), "data/tr/neighborhoods", `${provinceId}.json`);
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string[]>;
  const names = data[String(districtId)] ?? [];
  return [...names].sort((a, b) => a.localeCompare(b, "tr"));
}

export function findProvince(provinceId: number): Province | undefined {
  return getProvinces().find((province) => province.id === provinceId);
}

export function matchPlaceName<T extends { name: string }>(items: T[], raw: string | undefined): T | undefined {
  if (!raw) return undefined;
  const target = normalizeTr(raw);
  return items.find((item) => normalizeTr(item.name) === target)
    ?? items.find((item) => normalizeTr(item.name).includes(target) || target.includes(normalizeTr(item.name)));
}
