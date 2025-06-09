// utils/streak-requirements.ts

export const STREAK_REQUIREMENTS = {
  PROFILE_EDITING: 30,        // Profile changes (username, school, daily target, avatar)
  STUDY_BUDDY_FEATURES: 15,   // Creating posts and sending messages
  CODE_SNIPPET_SHARING: 30,   // Sharing code snippets
} as const;

export const STREAK_REQUIREMENT_MESSAGES = {
  PROFILE_EDITING: `Profil bilgilerini değiştirmek için ${STREAK_REQUIREMENTS.PROFILE_EDITING} gün istikrarın olması gerekiyor.`,
  STUDY_BUDDY_FEATURES: `Çalışma arkadaşı özelliklerini kullanmak için ${STREAK_REQUIREMENTS.STUDY_BUDDY_FEATURES} gün istikrarın olması gerekiyor.`,
  CODE_SNIPPET_SHARING: `Kod parçacığı paylaşmak için ${STREAK_REQUIREMENTS.CODE_SNIPPET_SHARING} gün istikrarın olması gerekiyor.`,
} as const;

export type StreakRequirementType = keyof typeof STREAK_REQUIREMENTS;

// Interface for user achievements
export interface UserAchievements {
  profileEditingUnlocked?: boolean;
  studyBuddyUnlocked?: boolean;
  codeShareUnlocked?: boolean;
}

/**
 * Check if user meets the streak requirement for a specific feature
 * Now checks both current streak AND permanent unlocks
 */
export function checkStreakRequirement(
  currentStreak: number, 
  requirement: StreakRequirementType,
  achievements?: UserAchievements
): boolean {
  // First check if feature is permanently unlocked
  if (achievements) {
    switch (requirement) {
      case 'PROFILE_EDITING':
        if (achievements.profileEditingUnlocked) return true;
        break;
      case 'STUDY_BUDDY_FEATURES':
        if (achievements.studyBuddyUnlocked) return true;
        break;
      case 'CODE_SNIPPET_SHARING':
        if (achievements.codeShareUnlocked) return true;
        break;
    }
  }
  
  // Fall back to current streak requirement
  return currentStreak >= STREAK_REQUIREMENTS[requirement];
}

/**
 * Legacy function for backward compatibility - only checks current streak
 */
export function checkCurrentStreakRequirement(
  currentStreak: number, 
  requirement: StreakRequirementType
): boolean {
  return currentStreak >= STREAK_REQUIREMENTS[requirement];
}

/**
 * Check if user has achieved the streak milestone for the first time
 */
export function hasAchievedMilestone(
  currentStreak: number,
  requirement: StreakRequirementType,
  wasAlreadyUnlocked: boolean
): boolean {
  return !wasAlreadyUnlocked && currentStreak >= STREAK_REQUIREMENTS[requirement];
}

/**
 * Get the message to show when user doesn't meet streak requirement
 */
export function getStreakRequirementMessage(requirement: StreakRequirementType): string {
  return STREAK_REQUIREMENT_MESSAGES[requirement];
}

/**
 * Get remaining days needed to meet a streak requirement
 */
export function getRemainingDays(
  currentStreak: number, 
  requirement: StreakRequirementType
): number {
  const required = STREAK_REQUIREMENTS[requirement];
  return Math.max(0, required - currentStreak);
}

/**
 * Generate a user-friendly message about streak progress
 */
export function getStreakProgressMessage(
  currentStreak: number, 
  requirement: StreakRequirementType,
  isUnlocked?: boolean
): string {
  if (isUnlocked) {
    return `🎉 Bu özellik kalıcı olarak açıldı!`;
  }
  
  const remaining = getRemainingDays(currentStreak, requirement);
  const required = STREAK_REQUIREMENTS[requirement];
  
  if (remaining === 0) {
    return `🎉 Tebrikler! ${required} gün istikrarına ulaştın!`;
  }
  
  return `📈 ${remaining} gün daha istikrar gerekiyor (${currentStreak}/${required})`;
}

/**
 * Get all streak requirements for display in rules section
 */
export function getAllStreakRules(): Array<{
  feature: string;
  requirement: number;
  description: string;
}> {
  return [
    {
      feature: "Profil Düzenleme",
      requirement: STREAK_REQUIREMENTS.PROFILE_EDITING,
      description: "Kullanıcı adı, okul, günlük hedef ve profil fotoğrafı değişikliği"
    },
    {
      feature: "Çalışma Arkadaşı",
      requirement: STREAK_REQUIREMENTS.STUDY_BUDDY_FEATURES,
      description: "Gönderi oluşturma ve mesaj gönderme"
    },
    {
      feature: "Kod Paylaşımı",
      requirement: STREAK_REQUIREMENTS.CODE_SNIPPET_SHARING,
      description: "Kod parçacığı paylaşma"
    }
  ];
} 