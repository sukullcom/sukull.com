export const POINTS_TO_REFILL = 200;

// Centralized Scoring System
export const SCORING_SYSTEM = {
  // Base points for different activities
  LESSON_CHALLENGE_FIRST: 10,     // First time completing a challenge
  LESSON_CHALLENGE_PRACTICE: 20,  // Practicing completed challenges
  LESSON_CHALLENGE_PENALTY: -10,  // Wrong answer penalty
  
  // Game scoring with difficulty multipliers
  GAMES: {
    SNAKE: {
      BASE_WORD: 1,                // Base points per word completed (kept at minimum)
      DIFFICULTY_MULTIPLIER: {     // Multiplier based on topic difficulty level
        'beginner': 1.0,
        'intermediate': 1.5,
        'advanced': 2.0,
      },
      TOPIC_MULTIPLIER: {          // Additional multiplier for specific topics
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
      STREAK_BONUS: 1,             // Bonus per consecutive word in same game (kept at minimum)
      PERFECT_GAME_BONUS: 2,       // Bonus for completing all words without mistakes (reduced from 4)
      SENTENCE_WORD_BONUS: 1,      // Extra bonus for collecting sentence words (kept at minimum)
      SENTENCE_COMPLETION_BONUS: 3, // Bonus for completing a full sentence (reduced from 5)
    },
    SUBSCRIBE: {
      CORRECT_WORD: 1,             // Points per correct word - flat 1 point regardless of difficulty
      INCORRECT_PENALTY: -1,       // Penalty for wrong attempt
      DIFFICULTY_MULTIPLIER: {
        'Kolay': 1.0,
        'Orta': 1.0,
        'Zor': 1.0,
      },
      COMPLETION_BONUS: 15,        // Bonus for completing entire lyrics
      PERFECT_BONUS: 25,           // Bonus for no mistakes
    },
    LAB: {
      JOURNEY_OF_FOOD: {
        CORRECT_MATCH: 2,          // Points per correct match (increased from 1)
        INCORRECT_PENALTY: -1,     // Penalty for wrong match
        COMPLETION_BONUS: 10,      // Bonus for completing all matches
      },
      HUMAN_BODY: {
        CORRECT_WORD: 3,           // Points per guessed word (increased from 2)
        FAILED_WORD: -2,           // Penalty for failed word
        HINT_PENALTY: -1,          // Penalty for using hints (future feature)
        COMPLETION_BONUS: 15,      // Bonus for completing all words
      }
    }
  },
  
  // Streak bonuses (applied to daily totals)
  STREAK_BONUSES: {
    DAILY_STREAK_3: 5,     // 3 day streak bonus
    DAILY_STREAK_7: 15,    // 7 day streak bonus  
    DAILY_STREAK_15: 30,   // 15 day streak bonus
    DAILY_STREAK_30: 50,   // 30 day streak bonus
    DAILY_STREAK_60: 100,  // 60 day streak bonus
  },
  
  // Performance bonuses
  PERFORMANCE_BONUSES: {
    FAST_COMPLETION: 5,      // Bonus for completing quickly
    NO_MISTAKES: 10,         // Bonus for perfect performance
    FIRST_TRY: 3,           // Bonus for getting it right first try
  }
} as const;

// Helper functions for point calculations
export const calculateGamePoints = (
  gameType: keyof typeof SCORING_SYSTEM.GAMES,
  baseScore: number,
  difficulty?: string,
  bonusType?: string
): number => {
  const gameConfig = SCORING_SYSTEM.GAMES[gameType];
  let points = baseScore;
  
  // Apply difficulty multiplier if available
  if (difficulty && 'DIFFICULTY_MULTIPLIER' in gameConfig) {
    const multiplier = (gameConfig.DIFFICULTY_MULTIPLIER as any)[difficulty] || 1.0;
    points = Math.round(points * multiplier);
  }
  
  // Apply bonus if specified
  if (bonusType && bonusType in gameConfig) {
    points += (gameConfig as any)[bonusType];
  }
  
  return Math.max(0, points); // Ensure non-negative
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

// Güncellenmiş görev listesi
export const quests = [
  {
    title: "100 Puan Topla",
    value: 100,
  },
  {
    title: "1000 Puan Topla",
    value: 1000,
  },
  {
    title: "5000 Puan Topla", 
    value: 5000,
  },
  {
    title: "10.000 Puan Topla",
    value: 10000,
  },
  {
    title: "100.000 Puan Topla",
    value: 100000,
  },
  {
    title: "1.000.000 Puan Topla",
    value: 1000000,
  },
];