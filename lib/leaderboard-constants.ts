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
 * Listede yer almak için (şimdilik): okulda en az bir öğrencinin
 * `user_progress.points > 0` olması — bkz. `schoolHasStudentWithPoints()`.
 * Cron'daki `MIN_ACTIVE_STUDENTS` yalnızca tip bazlı prior medyanı içindir.
 */

/** Aktiflik penceresi — son N gün (Bayesian skor / active_student_count). */
export const LEADERBOARD_ACTIVE_WINDOW_DAYS = 30;

/**
 * Tip bazlı prior medyanında hangi okullar dikkate alınsın (cron).
 * Liste görünürlüğü için kullanılmaz.
 */
export const LEADERBOARD_MIN_ACTIVE_STUDENTS = 1;

/** Listede görünmek için okulda gereken asgari puanlı öğrenci (şimdilik 1). */
export const LEADERBOARD_MIN_STUDENTS_WITH_POINTS = 1;

/**
 * Şimdilik okul liderliği sıralaması ve UI'daki ana "Skor" alanı
 * `schools.total_points` (Bayesian `top_avg_score` değil).
 */
export const LEADERBOARD_SCHOOL_RANK_BY_TOTAL_POINTS = true;

/**
 * Bayesian prior'ın "ağırlığı". Eşikle simetrik: 10 aktif öğrencili okul
 * prior_mean ile yarı yarıya karışır; 100 aktif öğrencili okul kendi
 * ortalamasını ~%91 oranında korur.
 */
export const LEADERBOARD_PRIOR_STRENGTH = 10;
