import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getUserCredits, getUserProgress } from "@/db/queries";
import { getStreakCount } from "@/actions/daily-streak";

// ✅ CONSOLIDATED USER API: Replaces /api/user/credits, /api/user/progress, and /api/user/streak
export async function GET(request: NextRequest) {
  try {
    // ✅ UNIFIED AUTH: Single authentication check instead of duplicated across routes
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'credits': {
        // Get user's credits
        const credits = await getUserCredits(user.id);
        return NextResponse.json(credits);
      }

      case 'progress': {
        // Get user's progress
        const userProgress = await getUserProgress();
        if (!userProgress) {
          return NextResponse.json({ error: "User progress not found" }, { status: 404 });
        }

        return NextResponse.json({
          hearts: userProgress.hearts,
          points: userProgress.points,
          hasInfiniteHearts: userProgress.hasInfiniteHearts || false,
        });
      }

      case 'streak': {
        // ✅ NEW: Get user's streak count
        const streakCount = await getStreakCount(user.id);
        return NextResponse.json({ 
          streak: streakCount,
          userId: user.id 
        });
      }

      case 'profile': {
        // Get basic user profile information
        return NextResponse.json({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatar: user.user_metadata?.avatar_url || null,
          role: user.user_metadata?.role || 'student',
          createdAt: user.created_at,
        });
      }

      case 'stats': {
        // Get comprehensive user statistics
        const [credits, progress, streakCount] = await Promise.all([
          getUserCredits(user.id),
          getUserProgress(),
          getStreakCount(user.id)
        ]);

        return NextResponse.json({
          profile: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            avatar: user.user_metadata?.avatar_url || null,
            role: user.user_metadata?.role || 'student',
          },
          credits: credits,
          progress: progress ? {
            hearts: progress.hearts,
            points: progress.points,
            hasInfiniteHearts: progress.hasInfiniteHearts || false,
          } : null,
          streak: streakCount,
        });
      }

      default: {
        return NextResponse.json({ 
          error: "Invalid action parameter. Supported actions: credits, progress, streak, profile, stats" 
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error(`Error in user API (action: ${request.url}):`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 