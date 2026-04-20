import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import db from "@/db/drizzle";
import { challenges, challengeOptions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function POST() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Bu işlem için yönetici yetkisi gereklidir." }, { status: 403 });
    }

    const sequenceChallenges = await db.query.challenges.findMany({
      where: eq(challenges.type, "SEQUENCE"),
      with: {
        challengeOptions: {
          orderBy: [asc(challengeOptions.id)],
        },
      },
    });

    let fixedOptions = 0;
    let fixedChallenges = 0;

    for (const challenge of sequenceChallenges) {
      const hasNullOrders = challenge.challengeOptions.some(
        (opt) => opt.correctOrder === null || opt.correctOrder === undefined
      );

      if (!hasNullOrders) continue;

      const sorted = [...challenge.challengeOptions].sort((a, b) => a.id - b.id);

      for (let i = 0; i < sorted.length; i++) {
        await db
          .update(challengeOptions)
          .set({ correctOrder: i + 1 })
          .where(eq(challengeOptions.id, sorted[i].id));
        fixedOptions++;
      }
      fixedChallenges++;
    }

    return NextResponse.json({
      success: true,
      totalSequenceChallenges: sequenceChallenges.length,
      fixedChallenges,
      fixedOptions,
    });
  } catch (error) {
    console.error("Fix sequence orders error:", error);
    return NextResponse.json(
      { error: "Failed to fix sequence orders" },
      { status: 500 }
    );
  }
}
