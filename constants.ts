export const POINTS_TO_REFILL = 100;

export const SCORING_SYSTEM = {
  LESSON_CHALLENGE_FIRST: 10,
  LESSON_CHALLENGE_PRACTICE: 5,
  LESSON_CHALLENGE_PENALTY: -1,

  LESSON_COMPLETION_BONUS: 5,
  PERFECT_LESSON_BONUS: 15,

  GAMES: {
    SNAKE: {
      BASE_WORD: 1,
      DIFFICULTY_MULTIPLIER: {
        'beginner': 1.0,
        'intermediate': 1.5,
        'advanced': 2.0,
      },
      TOPIC_MULTIPLIER: {
        'Colors': 1.0,
        'Animals': 1.1,
        'Numbers': 0.9,
        'Body Parts': 1.2,
        'School': 1.1,
        'Weather': 1.3,
        'Emotions': 1.4,
        'Technology': 1.6,
        'Business': 1.5,
      },
      STREAK_BONUS: 1,
      PERFECT_GAME_BONUS: 2,
      SENTENCE_WORD_BONUS: 1,
      SENTENCE_COMPLETION_BONUS: 3,
    },
    SUBSCRIBE: {
      CORRECT_WORD: 1,
      INCORRECT_PENALTY: -1,
      DIFFICULTY_MULTIPLIER: {
        'Kolay': 1.0,
        'Orta': 1.5,
        'Zor': 2.0,
        'Aşırı Zor': 2.5,
      } as Record<string, number>,
      COMPLETION_BONUS: 15,
      PERFECT_BONUS: 25,
    },
    SPEED_MATH: {
      CORRECT_ANSWER: 2,
      SPEED_BONUS_THRESHOLD_MS: 2000,
      SPEED_BONUS: 1,
      COMBO_MULTIPLIER_STEP: 0.25,
      MAX_COMBO_MULTIPLIER: 3.0,
      DIFFICULTY_MULTIPLIER: {
        'Kolay': 1.0,
        'Orta': 1.5,
        'Zor': 2.0,
        'Uzman': 3.0,
      },
      GAME_DURATION_SECONDS: 60,
    },
    MEMORY_MATCH: {
      MATCH_POINTS: 3,
      DIFFICULTY_MULTIPLIER: {
        'Kolay': 1.0,
        'Orta': 1.5,
        'Zor': 2.0,
        'Uzman': 2.5,
      } as Record<string, number>,
      PERFECT_BONUS: 20,
      TIME_BONUS_THRESHOLD_SECONDS: 60,
      TIME_BONUS: 10,
      MIN_MOVES_BONUS: 10,
    },
    TRUE_FALSE: {
      CORRECT_ANSWER: 2,
      SPEED_BONUS: 1,
      STREAK_BONUS_THRESHOLD: 5,
      STREAK_BONUS: 3,
      LIVES: 3,
      BASE_TIME_SECONDS: 4,
      MIN_TIME_SECONDS: 1.5,
      TIME_DECREASE_PER_QUESTION: 0.05,
      DIFFICULTY_MULTIPLIER: {
        'Kolay': 1.0,
        'Orta': 1.3,
        'Zor': 1.6,
        'Uzman': 2.0,
      } as Record<string, number>,
    },
    PATTERN_MEMORY: {
      BASE_POINTS_PER_LEVEL: 2,
      LEVEL_MULTIPLIER: 1.5,
      MODE_MULTIPLIER: {
        'colors': 1.0,
        'numbers': 1.2,
        'mixed': 1.5,
        'timed': 2.0,
      } as Record<string, number>,
      PERFECT_SEQUENCE_BONUS: 5,
    },
    MEMORY_MATRIX: {
      BASE_POINTS_PER_LEVEL: 3,
      LEVEL_MULTIPLIER: 1.3,
      PERFECT_LEVEL_BONUS: 2,
      DIFFICULTY_MULTIPLIER: {
        'Kolay': 1.0,
        'Orta': 1.3,
        'Zor': 1.6,
        'Uzman': 2.0,
      } as Record<string, number>,
    },
    STROOP: {
      CORRECT_ANSWER: 2,
      SPEED_BONUS_THRESHOLD_MS: 1500,
      SPEED_BONUS: 1,
      STREAK_BONUS_THRESHOLD: 5,
      STREAK_BONUS: 3,
      LIVES: 3,
      BASE_TIME_SECONDS: 4,
      MIN_TIME_SECONDS: 2,
      TIME_DECREASE_PER_QUESTION: 0.03,
      DIFFICULTY_MULTIPLIER: {
        'Kolay': 1.0,
        'Orta': 1.3,
        'Zor': 1.6,
        'Uzman': 2.0,
      } as Record<string, number>,
    },
    LAB: {
      JOURNEY_OF_FOOD: {
        CORRECT_MATCH: 2,
        INCORRECT_PENALTY: -1,
        COMPLETION_BONUS: 10,
      },
      HUMAN_BODY: {
        CORRECT_WORD: 3,
        FAILED_WORD: -2,
        HINT_PENALTY: -1,
        COMPLETION_BONUS: 15,
      }
    }
  },

  STREAK_BONUSES: {
    DAILY_STREAK_3: 10,
    DAILY_STREAK_7: 30,
    DAILY_STREAK_15: 75,
    DAILY_STREAK_30: 150,
    DAILY_STREAK_60: 300,
  },

  HEART_REGEN_INTERVAL_HOURS: 24,
  HEART_MAX: 5,

  STREAK_FREEZE_COST: 200,
} as const;

export const calculateGamePoints = (
  gameType: keyof typeof SCORING_SYSTEM.GAMES,
  baseScore: number,
  difficulty?: string,
  bonusType?: string
): number => {
  const gameConfig = SCORING_SYSTEM.GAMES[gameType];
  let points = baseScore;

  if (difficulty && 'DIFFICULTY_MULTIPLIER' in gameConfig) {
    const multiplier = ((gameConfig as unknown as { DIFFICULTY_MULTIPLIER: Record<string, number> }).DIFFICULTY_MULTIPLIER)[difficulty] || 1.0;
    points = Math.round(points * multiplier);
  }

  if (bonusType && bonusType in gameConfig) {
    points += (gameConfig as unknown as Record<string, number>)[bonusType];
  }

  return Math.max(0, points);
};

export const calculateStreakBonus = (streakDays: number): number => {
  const bonuses = SCORING_SYSTEM.STREAK_BONUSES;

  if (streakDays >= 60) return bonuses.DAILY_STREAK_60;
  if (streakDays >= 30) return bonuses.DAILY_STREAK_30;
  if (streakDays >= 15) return bonuses.DAILY_STREAK_15;
  if (streakDays >= 7) return bonuses.DAILY_STREAK_7;
  if (streakDays >= 3) return bonuses.DAILY_STREAK_3;

  return 0;
};

export const quests = [
  { title: "100 Puan Topla", value: 100 },
  { title: "1.000 Puan Topla", value: 1000 },
  { title: "5.000 Puan Topla", value: 5000 },
  { title: "10.000 Puan Topla", value: 10000 },
  { title: "100.000 Puan Topla", value: 100000 },
  { title: "1.000.000 Puan Topla", value: 1000000 },
];

export type DailyChallengeType =
  | "questions_count"
  | "distinct_subjects"
  | "game_score"
  | "perfect_lessons"
  | "questions_marathon"
  | "distinct_games"
  | "exceed_target";

export type DailyChallengeDefinition = {
  id: DailyChallengeType;
  title: string;
  description: string;
  target: number;
  bonusPoints: number;
  unit: string;
};

export const DAILY_CHALLENGES: DailyChallengeDefinition[] = [
  {
    id: "questions_count",
    title: "Soru Avcısı",
    description: "18 soru çöz",
    target: 18,
    bonusPoints: 50,
    unit: "soru",
  },
  {
    id: "distinct_subjects",
    title: "Çok Yönlü",
    description: "3 farklı dersten soru çöz",
    target: 3,
    bonusPoints: 40,
    unit: "ders",
  },
  {
    id: "game_score",
    title: "Oyun Ustası",
    description: "Bir oyun oyna ve 50+ puan kazan",
    target: 50,
    bonusPoints: 40,
    unit: "puan",
  },
  {
    id: "perfect_lessons",
    title: "Kusursuz",
    description: "2 dersi hatasız tamamla",
    target: 2,
    bonusPoints: 60,
    unit: "ders",
  },
  {
    id: "questions_marathon",
    title: "Maraton",
    description: "24 soru çöz",
    target: 24,
    bonusPoints: 75,
    unit: "soru",
  },
  {
    id: "distinct_games",
    title: "Oyun Gezgini",
    description: "3 farklı oyun oyna",
    target: 3,
    bonusPoints: 50,
    unit: "oyun",
  },
  {
    id: "exceed_target",
    title: "Hedefini Aş",
    description: "Günlük hedefinin 1.5 katını tamamla",
    target: 150,
    bonusPoints: 60,
    unit: "%",
  },
];
