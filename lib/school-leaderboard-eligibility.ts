import { sql } from "drizzle-orm";

import { schools, userProgress } from "@/db/schema";
/**
 * Okul liderlik listesine girebilir mi?
 *
 * Şimdilik: son-30-gün "aktif" şartı yok — `user_progress` içinde bu okula
 * bağlı ve puanı > 0 olan en az bir öğrenci yeterli. Sıralama skoru hâlâ
 * cron'daki Bayesian `top_avg_score` (aktif öğrenci penceresi) ile yapılır;
 * aktifi olmayan okullar genelde listenin altında kalır.
 */
export function schoolHasStudentWithPoints() {
  return sql`EXISTS (
    SELECT 1
    FROM ${userProgress}
    WHERE ${userProgress.schoolId} = ${schools.id}
      AND ${userProgress.points} > 0
  )`;
}

/** Okulda puanı > 0 olan kayıtlı öğrenci sayısı (liste alt metni için). */
export const schoolPointingStudentCountSql = sql<number>`(
  SELECT COUNT(*)::int
  FROM ${userProgress}
  WHERE ${userProgress.schoolId} = ${schools.id}
    AND ${userProgress.points} > 0
)`;
