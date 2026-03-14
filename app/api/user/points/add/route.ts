import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { addPointsToUser } from "@/actions/challenge-progress";

/**
 * POST /api/user/points/add
 * Adds points to user and automatically updates streak
 * Used by mobile app to ensure streak is synced across platforms
 * 
 * Body: { points: number }
 */
export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { points } = body;

    // Validate points
    if (!points || typeof points !== 'number' || points <= 0) {
      return NextResponse.json(
        { error: "Invalid points amount" },
        { status: 400 }
      );
    }

    // Add points (this will automatically check and update streak)
    await addPointsToUser(points);

    return NextResponse.json({ 
      success: true,
      pointsAdded: points,
      message: "Points added and streak updated"
    });
  } catch (error) {
    console.error("Error adding points:", error);
    return NextResponse.json(
      { error: "Failed to add points" },
      { status: 500 }
    );
  }
}

