import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { userCredits } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's credits
    const credits = await db.query.userCredits.findFirst({
      where: eq(userCredits.userId, user.id),
    });

    // If no credits record exists, return default values
    if (!credits) {
      return NextResponse.json({
        totalCredits: 0,
        usedCredits: 0,
        availableCredits: 0
      });
    }

    return NextResponse.json({
      totalCredits: credits.totalCredits,
      usedCredits: credits.usedCredits,
      availableCredits: credits.availableCredits
    });

  } catch (error) {
    console.error("Error fetching user credits:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching credits" },
      { status: 500 }
    );
  }
} 