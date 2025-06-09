import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkStreakContinuity, updateDailyStreak } from "@/actions/daily-streak";
import { hasAchievedMilestone } from "@/utils/streak-requirements";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Check streak continuity and update daily streak like the profile page does
    await checkStreakContinuity(userId);
    await updateDailyStreak();

    // Get user progress with streak data and achievements
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: {
        istikrar: true,
        dailyTarget: true,
        points: true,
        previousTotalPoints: true,
        profileEditingUnlocked: true,
        studyBuddyUnlocked: true,
        codeShareUnlocked: true,
      },
    });

    if (!progress) {
      return NextResponse.json({
        streak: 0,
        dailyTarget: 50,
        points: 0,
        previousTotalPoints: 0,
        achievements: {
          profileEditingUnlocked: false,
          studyBuddyUnlocked: false,
          codeShareUnlocked: false,
        },
      });
    }

    const currentStreak = progress.istikrar || 0;
    const achievements = {
      profileEditingUnlocked: progress.profileEditingUnlocked || false,
      studyBuddyUnlocked: progress.studyBuddyUnlocked || false,
      codeShareUnlocked: progress.codeShareUnlocked || false,
    };

    // Check for new achievements and update database if needed
    const newUnlocks: Partial<typeof achievements> = {};
    
    if (hasAchievedMilestone(currentStreak, 'PROFILE_EDITING', achievements.profileEditingUnlocked)) {
      newUnlocks.profileEditingUnlocked = true;
      achievements.profileEditingUnlocked = true;
    }
    
    if (hasAchievedMilestone(currentStreak, 'STUDY_BUDDY_FEATURES', achievements.studyBuddyUnlocked)) {
      newUnlocks.studyBuddyUnlocked = true;
      achievements.studyBuddyUnlocked = true;
    }
    
    if (hasAchievedMilestone(currentStreak, 'CODE_SNIPPET_SHARING', achievements.codeShareUnlocked)) {
      newUnlocks.codeShareUnlocked = true;
      achievements.codeShareUnlocked = true;
    }

    // Update database with new unlocks if any
    if (Object.keys(newUnlocks).length > 0) {
      await db.update(userProgress)
        .set(newUnlocks)
        .where(eq(userProgress.userId, userId));
      
      console.log(`New achievements unlocked for user ${userId}:`, newUnlocks);
    }

    return NextResponse.json({
      streak: currentStreak,
      dailyTarget: progress.dailyTarget || 50,
      points: progress.points || 0,
      previousTotalPoints: progress.previousTotalPoints || 0,
      achievements,
    });
  } catch (error) {
    console.error("Error fetching user streak:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 