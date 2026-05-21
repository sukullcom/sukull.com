import { readFile } from "node:fs/promises";
import path from "node:path";

import { BRAND_MASCOT_FILE, BRAND_MASCOT_MIME } from "@/lib/brand-mascot";

/**
 * `ImageResponse` (Satori) için maskot data URL — şeffaf zemin, çerçevesiz.
 *
 * PNG kaynağı kullanıyoruz çünkü Satori karmaşık SVG'leri (özellikle
 * içinde base64-PNG taşıyan büyük SVG'leri) sessizce yanlış render
 * edebiliyor. PNG ile doğrudan embed → garantili sonuç.
 */
export async function loadBrandMascotDataUrl(): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), BRAND_MASCOT_FILE));
    return `data:${BRAND_MASCOT_MIME};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
