import { describe, it, expect } from "vitest";
import {
  checkStreakRequirement,
  checkCurrentStreakRequirement,
  hasAchievedMilestone,
  getRemainingDays,
  STREAK_REQUIREMENTS,
} from "@/utils/streak-requirements";

describe("checkStreakRequirement", () => {
  describe("current streak only (no achievements)", () => {
    it("allows access when streak meets the requirement", () => {
      expect(
        checkStreakRequirement(STREAK_REQUIREMENTS.USERNAME_CHANGE, "USERNAME_CHANGE"),
      ).toBe(true);
    });

    it("allows access when streak exceeds the requirement", () => {
      expect(checkStreakRequirement(50, "AVATAR_CHANGE")).toBe(true);
    });

    it("denies access when streak is below requirement", () => {
      expect(
        checkStreakRequirement(STREAK_REQUIREMENTS.AVATAR_CHANGE - 1, "AVATAR_CHANGE"),
      ).toBe(false);
    });

    it("denies access at streak zero", () => {
      expect(checkStreakRequirement(0, "USERNAME_CHANGE")).toBe(false);
    });
  });

  describe("permanent achievements override low streak", () => {
    it("profileEditingUnlocked covers USERNAME_CHANGE", () => {
      expect(
        checkStreakRequirement(0, "USERNAME_CHANGE", {
          profileEditingUnlocked: true,
        }),
      ).toBe(true);
    });

    it("profileEditingUnlocked covers SCHOOL_SELECTION", () => {
      expect(
        checkStreakRequirement(0, "SCHOOL_SELECTION", {
          profileEditingUnlocked: true,
        }),
      ).toBe(true);
    });

    it("studyBuddyUnlocked does NOT cover USERNAME_CHANGE", () => {
      // studyBuddy unlock must only grant the study-buddy feature
      expect(
        checkStreakRequirement(0, "USERNAME_CHANGE", {
          studyBuddyUnlocked: true,
        }),
      ).toBe(false);
    });

    it("studyBuddyUnlocked covers STUDY_BUDDY_FEATURES", () => {
      expect(
        checkStreakRequirement(0, "STUDY_BUDDY_FEATURES", {
          studyBuddyUnlocked: true,
        }),
      ).toBe(true);
    });

    it("codeShareUnlocked covers CODE_SNIPPET_SHARING", () => {
      expect(
        checkStreakRequirement(0, "CODE_SNIPPET_SHARING", {
          codeShareUnlocked: true,
        }),
      ).toBe(true);
    });

    it("without matching unlock, falls back to streak check", () => {
      expect(
        checkStreakRequirement(STREAK_REQUIREMENTS.STUDY_BUDDY_FEATURES, "STUDY_BUDDY_FEATURES", {
          profileEditingUnlocked: true,
        }),
      ).toBe(true);
    });
  });
});

describe("checkCurrentStreakRequirement (legacy)", () => {
  it("only checks streak — ignores achievements", () => {
    expect(checkCurrentStreakRequirement(0, "USERNAME_CHANGE")).toBe(false);
    expect(
      checkCurrentStreakRequirement(STREAK_REQUIREMENTS.USERNAME_CHANGE, "USERNAME_CHANGE"),
    ).toBe(true);
  });
});

describe("hasAchievedMilestone", () => {
  it("returns true exactly at the threshold when not previously unlocked", () => {
    expect(
      hasAchievedMilestone(
        STREAK_REQUIREMENTS.AVATAR_CHANGE,
        "AVATAR_CHANGE",
        false,
      ),
    ).toBe(true);
  });

  it("returns false once already unlocked", () => {
    expect(
      hasAchievedMilestone(
        STREAK_REQUIREMENTS.AVATAR_CHANGE + 10,
        "AVATAR_CHANGE",
        true,
      ),
    ).toBe(false);
  });

  it("returns false below the threshold", () => {
    expect(
      hasAchievedMilestone(
        STREAK_REQUIREMENTS.AVATAR_CHANGE - 1,
        "AVATAR_CHANGE",
        false,
      ),
    ).toBe(false);
  });
});

describe("getRemainingDays", () => {
  it("returns remaining days when short of requirement", () => {
    expect(getRemainingDays(2, "USERNAME_CHANGE")).toBe(
      STREAK_REQUIREMENTS.USERNAME_CHANGE - 2,
    );
  });

  it("clamps to zero when requirement met or exceeded", () => {
    expect(getRemainingDays(STREAK_REQUIREMENTS.USERNAME_CHANGE, "USERNAME_CHANGE")).toBe(0);
    expect(getRemainingDays(100, "USERNAME_CHANGE")).toBe(0);
  });
});
