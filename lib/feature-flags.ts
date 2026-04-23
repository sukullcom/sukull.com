/**
 * Merkezi özellik bayrakları.
 *
 * Amaç: Bir bölümü silmeden "gizli" hale getirmek. Bayrak kapalıyken:
 *   • middleware.ts ilgili route prefix'ine gelen istekleri /games'e yönlendirir
 *   • layout/page seviyesinde ek bir `redirect()` savunma katmanı devreye girer
 *   • sitemap.ts bu URL'leri yaymaz
 *   • robots.ts bu URL'leri disallow eder
 *
 * Bayrak açmak için ilgili env değişkenini `"true"` string'i olarak ayarla:
 *   NEXT_PUBLIC_ENABLE_LAB=true
 *   NEXT_PUBLIC_ENABLE_CODE_EDITOR=true
 *
 * NEXT_PUBLIC_ prefix'i bilinçli seçildi — middleware (edge) ve hem server
 * hem client bileşenler aynı bayrağı okuyabilmeli.
 */

const asBool = (v: string | undefined) => v === "true" || v === "1";

export const FEATURE_FLAGS = {
  lab: asBool(process.env.NEXT_PUBLIC_ENABLE_LAB),
  codeEditor: asBool(process.env.NEXT_PUBLIC_ENABLE_CODE_EDITOR),
} as const;

export function isLabEnabled(): boolean {
  return FEATURE_FLAGS.lab;
}

export function isCodeEditorEnabled(): boolean {
  return FEATURE_FLAGS.codeEditor;
}

/** Devre dışı bırakılmış route prefix'lerini verir (middleware için). */
export function getDisabledRoutePrefixes(): string[] {
  const prefixes: string[] = [];
  if (!isLabEnabled()) prefixes.push("/lab");
  if (!isCodeEditorEnabled()) prefixes.push("/sukull-code-editor");
  return prefixes;
}
