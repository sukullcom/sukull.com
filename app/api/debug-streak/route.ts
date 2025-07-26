import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    console.log("🔍 Debugging user progress and previous_total_points...");
    
    // Get sample of users to check their current state
    const users = await db.query.userProgress.findMany({
      columns: {
        userId: true,
        points: true,
        previousTotalPoints: true,
        lastStreakCheck: true,
        istikrar: true,
        dailyTarget: true,
      },
      limit: 10,
      orderBy: [desc(userProgress.points)],
    });
    
    const turkeyNow = new Date(new Date().getTime() + (3 * 60 * 60 * 1000));
    
    const analysis = users.map(user => {
      const pointsEarnedToday = Math.max(0, user.points - (user.previousTotalPoints || 0));
      const dailyTarget = user.dailyTarget || 50;
      const goalAchieved = pointsEarnedToday >= dailyTarget;
      
      return {
        userId: user.userId,
        currentPoints: user.points,
        previousTotalPoints: user.previousTotalPoints,
        pointsEarnedToday,
        dailyTarget,
        goalAchieved,
        currentStreak: user.istikrar,
        lastStreakCheck: user.lastStreakCheck,
        issue: user.previousTotalPoints === null ? "previousTotalPoints is null" : 
               user.previousTotalPoints === user.points ? "previousTotalPoints equals current points (good)" :
               "previousTotalPoints is outdated"
      };
    });

    return NextResponse.json({
      success: true,
      turkeyTime: turkeyNow.toISOString(),
      userCount: users.length,
      analysis,
      summary: {
        usersWithNullPreviousPoints: analysis.filter(u => u.previousTotalPoints === null).length,
        usersWithCorrectBaseline: analysis.filter(u => u.previousTotalPoints === u.currentPoints).length,
        usersWithOutdatedBaseline: analysis.filter(u => u.previousTotalPoints !== null && u.previousTotalPoints !== u.currentPoints).length,
      }
    });
  } catch (error) {
    console.error("Error in debug-streak:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 