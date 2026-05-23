/**
 * Liderlik tablosu için merkezi parametreler.
 *
 * Tüm SQL CTE'leri, query'ler, UI tooltip'leri ve admin gözlemi aynı
 * sayıları kullansın diye tek yerde tutuluyor. Değer değiştirmek için
 * burayı düzenle; tek bir deploy ile her yer senkron olur.
 *
 * Matematik (cron 'updateTotalPointsForSchools'):
 *
 *   bayes_score = (raw_avg × active_count + prior_mean × PRIOR_STRENGTH)
 *               / (active_count + PRIOR_STRENGTH)
 *
 *   prior_mean    = aynı okul tipindeki, MIN_ACTIVE_STUDENTS'ı geçen
 *                   okulların raw_avg değerlerinin **medyanı** (outlier-
 *                   robust; tek bir uçtan-mega-okul prior'ı bozmasın).
 *
 * Sıralama: bayes_score DESC, active_student_count DESC, name ASC.
 * Listede yer almak için: active_student_count >= MIN_ACTIVE_STUDENTS.
 */

/** Aktiflik penceresi — son N gün. */
export const LEADERBOARD_ACTIVE_WINDOW_DAYS = 30;

/** Listede yer almak için gereken aktif öğrenci sayısı. */
export const LEADERBOARD_MIN_ACTIVE_STUDENTS = 1;

/**
 * Bayesian prior'ın "ağırlığı". Eşikle simetrik: 10 aktif öğrencili okul
 * prior_mean ile yarı yarıya karışır; 100 aktif öğrencili okul kendi
 * ortalamasını ~%91 oranında korur.
 */
export const LEADERBOARD_PRIOR_STRENGTH = 10;
