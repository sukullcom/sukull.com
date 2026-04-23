import { NextResponse } from "next/server";
import { getAdminActor } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";
import db from "@/db/drizzle";
import { challenges, challengeOptions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function POST() {
  try {
    const actor = await getAdminActor();
    if (!actor) {
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

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "admin.fix_sequence_orders",
      metadata: {
        totalSequenceChallenges: sequenceChallenges.length,
        fixedChallenges,
        fixedOptions,
      },
    });

    return NextResponse.json({
      success: true,
      totalSequenceChallenges: sequenceChallenges.length,
      fixedChallenges,
      fixedOptions,
    });
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/admin/fix-sequence-orders" } }))
      .error({ message: "fix sequence orders failed", error, location: "api/admin/fix-sequence-orders" });
    return NextResponse.json(
      { error: "Failed to fix sequence orders" },
      { status: 500 }
    );
  }
}
