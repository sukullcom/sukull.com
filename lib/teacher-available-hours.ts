/**
 * Eğitmen başvurusu / profil — müsait saat seçenekleri (DB `available_hours` metin alanı).
 * Birden fazla seçim virgülle birleştirilir; öğrenci profilinde aynı metin gösterilir.
 */

export const TEACHER_AVAILABLE_HOURS_FLEXIBLE =
  "Esnek — uygun saatleri mesajla netleşirim" as const;

/** Yeni başvurularda gösterilen seçenekler (sıralı). */
export const TEACHER_AVAILABLE_HOUR_OPTIONS: readonly string[] = [
  "Sabah erken (07:00–09:00)",
  "Sabah (09:00–12:00)",
  "Öğle (12:00–14:00)",
  "Öğleden sonra (14:00–17:00)",
  "Akşam (17:00–21:00)",
  "Gece (21:00–23:00)",
  "Hafta içi (Pazartesi–Cuma)",
  "Hafta sonu (Cumartesi–Pazar)",
  TEACHER_AVAILABLE_HOURS_FLEXIBLE,
] as const;

/** Eski kayıtlar — profil düzenlemede seçili kalması için listede tutulur. */
export const TEACHER_AVAILABLE_HOUR_LEGACY_OPTIONS: readonly string[] = [
  "Öğleden sonra (12:00-17:00)",
  "Hafta sonu",
  "Esnek / Farketmez",
] as const;

export const TEACHER_AVAILABLE_HOURS_HELPER =
  "Birden fazla aralık seçebilirsin. Öğrenciler profilinde yalnızca bilgi amaçlı görür; kesin ders saati ve günü onay sonrası mesajlaşarak netleşir. Hiçbiri tam uymuyorsa yalnızca «Esnek» işaretlemen yeterlidir.";

export function parseTeacherAvailableHours(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinTeacherAvailableHours(selected: Iterable<string>): string {
  return Array.from(selected).join(", ");
}

/** Checkbox listesinde gösterilecek tüm seçenekler (yeni + eski, tekrarsız). */
export function allTeacherAvailableHourOptions(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of [
    ...TEACHER_AVAILABLE_HOUR_OPTIONS,
    ...TEACHER_AVAILABLE_HOUR_LEGACY_OPTIONS,
  ]) {
    if (!seen.has(o)) {
      seen.add(o);
      out.push(o);
    }
  }
  return out;
}
