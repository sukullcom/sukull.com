/**
 * Rozet tanımları ve kullanıcı istatistiklerinden kazanılıp kazanılmadığının hesaplanması.
 * Sunucu aksiyonları gerçek veriyi çeker; burası saf fonksiyon kalır.
 */

export type UserBadgeStats = {
  istikrar: number;
  maxAnswerStreak: number;
  totalChallengesCompleted: number;
  /** Genel sıralama (1 = birinci) */
  globalRank: number | null;
  /**
   * Aynı okuldaki öğrenciler arasında puana göre sıra (1 = okul birincisi).
   * Okul yoksa null.
   */
  schoolRank: number | null;
  /**
   * Öğrencinin okulunun, aynı okul tipinde (lise, üniversite…) toplam puana
   * göre sırası (1 = tip içinde en çok puanlı okul). Okul yoksa veya hesap
   * yoksa null.
   */
  schoolInstitutionRank: number | null;
  hasSchool: boolean;
};

export type BadgeRow = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
  category: "istikrar" | "performans" | "liderlik";
};

export function computeUserBadges(stats: UserBadgeStats): BadgeRow[] {
  const badges: BadgeRow[] = [];

  for (const t of [7, 30, 100] as const) {
    badges.push({
      id: `streak_${t}`,
      title: `${t} Gün İstikrar`,
      description: `${t} günlük istikrar serisine ulaş.`,
      unlocked: stats.istikrar >= t,
      progress: Math.min(stats.istikrar, t),
      target: t,
      category: "istikrar",
    });
  }

  for (const { t, title } of [
    { t: 10, title: "Onlu Seri" },
    { t: 25, title: "Çeyrek Yüz" },
    { t: 50, title: "Yarım Yüz" },
  ] as const) {
    badges.push({
      id: `answer_streak_${t}`,
      title,
      description: `Üst üste ${t} soruyu ilk denemede doğru çöz (yanlışta sıfırlanır).`,
      unlocked: stats.maxAnswerStreak >= t,
      progress: Math.min(stats.maxAnswerStreak, t),
      target: t,
      category: "performans",
    });
  }

  for (const t of [100, 500, 2000] as const) {
    badges.push({
      id: `solved_${t}`,
      title: `${t.toLocaleString("tr-TR")} Soru`,
      description: `Toplam ${t.toLocaleString("tr-TR")} soruyu tamamla.`,
      unlocked: stats.totalChallengesCompleted >= t,
      progress: Math.min(stats.totalChallengesCompleted, t),
      target: t,
      category: "performans",
    });
  }

  badges.push({
    id: "rank_global_1",
    title: "Zirvede",
    description: "Genel puanda birinci sıradasın.",
    unlocked: stats.globalRank === 1,
    category: "liderlik",
  });

  badges.push({
    id: "rank_global_2",
    title: "Gümüş Basamak",
    description: "Genel puanda ikinci sıradasın.",
    unlocked: stats.globalRank === 2,
    category: "liderlik",
  });

  badges.push({
    id: "rank_global_3",
    title: "Bronz Basamak",
    description: "Genel puanda üçüncü sıradasın.",
    unlocked: stats.globalRank === 3,
    category: "liderlik",
  });

  badges.push({
    id: "rank_school_1",
    title: "Okul Yıldızı",
    description: "Kendi okulundaki öğrenciler arasında puanda birincisin.",
    unlocked: stats.hasSchool && stats.schoolRank === 1,
    category: "liderlik",
  });

  badges.push({
    id: "rank_in_school_2",
    title: "Okulda İkinci",
    description: "Kendi okulundaki öğrenciler arasında puanda ikincisin.",
    unlocked: stats.hasSchool && stats.schoolRank === 2,
    category: "liderlik",
  });

  badges.push({
    id: "rank_in_school_3",
    title: "Okulda Üçüncü",
    description: "Kendi okulundaki öğrenciler arasında puanda üçüncüsün.",
    unlocked: stats.hasSchool && stats.schoolRank === 3,
    category: "liderlik",
  });

  badges.push({
    id: "school_among_type_1",
    title: "Okul Zirvesi",
    description:
      "Okulun, aynı tipteki okullar (ör. lise) arasında toplam puanda birinci.",
    unlocked:
      stats.hasSchool &&
      stats.schoolInstitutionRank != null &&
      stats.schoolInstitutionRank === 1,
    category: "liderlik",
  });

  badges.push({
    id: "school_among_type_2",
    title: "Okul Gümüşü",
    description:
      "Okulun, aynı tipteki okullar arasında toplam puanda ikinci.",
    unlocked:
      stats.hasSchool &&
      stats.schoolInstitutionRank != null &&
      stats.schoolInstitutionRank === 2,
    category: "liderlik",
  });

  badges.push({
    id: "school_among_type_3",
    title: "Okul Bronzu",
    description:
      "Okulun, aynı tipteki okullar arasında toplam puanda üçüncü.",
    unlocked:
      stats.hasSchool &&
      stats.schoolInstitutionRank != null &&
      stats.schoolInstitutionRank === 3,
    category: "liderlik",
  });

  return badges;
}
