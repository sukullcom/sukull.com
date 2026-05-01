import type { TeachingCapability } from "@/lib/teaching-offerings";
import { isValidTeachingGrade, isValidTeachingSubject } from "@/lib/teaching-offerings";

const MAX_BODY_BYTES = 256 * 1024;

/** Açı etiketleri / kısa metinler — HTML enjeksyonunu ve aşırı uzunluğu keser. */
export function sanitizeTeacherProfilePlainText(
  raw: string,
  maxLen: number,
): string {
  let s = raw.replace(/<[^>]*>/g, " ");
  s = s.replace(/[<>]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > maxLen) s = s.slice(0, maxLen).trim();
  return s;
}

/** Türkiye cep: normalize sonrası 10 hane ve 5 ile başlar. */
export function isValidTurkeyMobileForProfile(phone: string): boolean {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("90")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d.length === 10 && d.startsWith("5");
}

export function assertTeacherProfileBodySize(request: Request): void {
  const cl = request.headers.get("content-length");
  if (!cl) return;
  const n = Number.parseInt(cl, 10);
  if (Number.isFinite(n) && n > MAX_BODY_BYTES) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }
}

/**
 * `teacher_applications.field` eski arama / gösterim için “birincil branş”
 * tutar; asıl liste `capabilitiesJson`. Çoklu farklı ders satırı desteklenir —
 * yalnızca `field`, listenin ilk satırındaki ders ile aynı olmalı (give POST
 * ile aynı kural).
 */
export function validateCapabilitiesMatchPrimaryField(
  field: string,
  capabilities: TeachingCapability[],
): boolean {
  if (capabilities.length === 0) return false;
  if (!isValidTeachingSubject(field)) return false;
  if (field !== capabilities[0].subject) return false;
  for (const c of capabilities) {
    if (!isValidTeachingSubject(c.subject) || !isValidTeachingGrade(c.grade)) {
      return false;
    }
  }
  return true;
}
