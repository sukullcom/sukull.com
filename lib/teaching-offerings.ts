/**
 * Özel ders pazarında eğitmen başvurusu, ilan konusu ve eşleştirme için
 * tek doğruluk kaynağı — tüm etiketler birebir eşleşmeli (DB `subject` alanı).
 */

export type TeachingCapability = {
  subject: string;
  grade: string;
};

/** Ders / branş seçenekleri (DB ve UI’da aynı string) */
export const TEACHING_SUBJECTS: readonly string[] = [
  "Matematik",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Tarih",
  "Coğrafya",
  "Edebiyat",
  "İngilizce",
  "Almanca",
  "Fransızca",
  "Felsefe",
  "Müzik",
  "Resim",
  "Bilgisayar Bilimleri",
  "Kodlama",
  "Oyun geliştirme",
  "Ekonomi",
  "Rehberlik / Koçluk",
  "LGS hazırlık",
  "TYT hazırlık",
  "AYT / YKS hazırlık",
] as const;

/** Sınıf / seviye seçenekleri */
export const TEACHING_GRADES: readonly string[] = [
  "1.sınıf",
  "2.sınıf",
  "3.sınıf",
  "4.sınıf",
  "5.sınıf",
  "6.sınıf",
  "7.sınıf",
  "8.sınıf",
  "9.sınıf",
  "10.sınıf",
  "11.sınıf",
  "12.sınıf",
  "Hazırlık",
  "Üniversite",
  "Genel",
  "Tüm seviyeler",
] as const;

const SUBJECT_SET = new Set<string>(TEACHING_SUBJECTS);
const GRADE_SET = new Set<string>(TEACHING_GRADES);

export function isValidTeachingSubject(s: string): boolean {
  return SUBJECT_SET.has(s.trim());
}

export function isValidTeachingGrade(g: string): boolean {
  return GRADE_SET.has(g.trim());
}

export function normalizeCapabilities(
  raw: unknown,
): TeachingCapability[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: TeachingCapability[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const subject =
      typeof (row as { subject?: unknown }).subject === "string"
        ? (row as { subject: string }).subject.trim()
        : "";
    const grade =
      typeof (row as { grade?: unknown }).grade === "string"
        ? (row as { grade: string }).grade.trim()
        : "";
    if (!subject || !grade) continue;
    if (!isValidTeachingSubject(subject) || !isValidTeachingGrade(grade))
      continue;
    const key = `${subject}\0${grade}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ subject, grade });
  }
  return out.length > 0 ? out : null;
}

export function capabilityDisplayName(c: TeachingCapability): string {
  return `${c.subject} — ${c.grade}`;
}
