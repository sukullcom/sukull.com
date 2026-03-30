export const LESSON_CONFIG = {
  /** Öğretmenin ders başına kazanacağı tutar (TL) */
  TEACHER_EARNINGS_PER_LESSON: 25,

  /** Ders süresi (dakika) */
  LESSON_DURATION_MINUTES: 25,

  /** Derse katılma butonunun ders başlangıcından kaç dakika önce aktif olacağı */
  JOIN_BUFFER_MINUTES: 2,

  /** Öğrencinin dersi ücretsiz iptal edebileceği minimum süre (saat) */
  FREE_CANCELLATION_HOURS: 24,
} as const;
