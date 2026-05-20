import { readFile } from "node:fs/promises";
import path from "node:path";

import { BRAND_MASCOT_FILE } from "@/lib/brand-mascot";

/** `ImageResponse` (Satori) için maskot SVG data URL — şeffaf zemin, çerçevesiz. */
export async function loadBrandMascotDataUrl(): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), BRAND_MASCOT_FILE));
    return `data:image/svg+xml;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
