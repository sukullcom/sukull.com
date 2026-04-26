import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getRequestLogger } from "@/lib/logger";

export async function GET() {
  const log = await getRequestLogger({ labels: { route: "api/debug-streak" } });
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Bu işlem için yönetici yetkisi gereklidir." }, { status: 403 });
    }

    log.debug("debugging user progress and previous_total_points");
    
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
    // NEVER leak `error.message` to the client. Stack traces,
    // parameter names, and query fragments have all shown up inside
    // .message historically. The full diagnostic payload lives only in
    // `error_log`; operators query by x-request-id to retrieve it.
    log.error({
      message: "debug-streak failed",
      error,
      source: "api-route",
      location: "api/debug-streak",
    });
    return NextResponse.json(
      {
        success: false,
        error: "Sunucu tarafında bir hata oluştu.",
      },
      { status: 500 },
    );
  }
}
