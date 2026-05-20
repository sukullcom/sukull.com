import { eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  activityLog,
  challengeProgress,
  errorLog,
  listingOffers,
  listings,
  messageUnlocks,
  schools,
  snippets,
  studyBuddyChats,
  studyBuddyMessages,
  studyBuddyPosts,
  teacherApplications,
  userDailyChallenges,
  userDailyStreak,
  userProgress,
  users,
} from "@/db/schema";
import type * as schema from "@/db/schema";

type Db = NodePgDatabase<typeof schema>;

export type PurgeUserProgressSnapshot = {
  schoolId: number | null;
  points: number;
};

/**
 * KVKK / hesap silme ile aynı sıra: `public` tarafındaki tüm kişisel veriyi
 * tek transaction içinde siler. Auth (`auth.users`) ayrıca admin API ile silinmeli.
 */
export async function purgeUserFromDatabase(
  db: Db,
  userId: string,
  progress?: PurgeUserProgressSnapshot | null,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(challengeProgress).where(eq(challengeProgress.userId, userId));
    await tx.delete(userDailyStreak).where(eq(userDailyStreak.userId, userId));
    await tx.delete(userDailyChallenges).where(eq(userDailyChallenges.userId, userId));
    await tx.delete(snippets).where(eq(snippets.userId, userId));
    await tx.delete(teacherApplications).where(eq(teacherApplications.userId, userId));
    await tx.delete(activityLog).where(eq(activityLog.userId, userId));
    await tx.delete(listingOffers).where(eq(listingOffers.teacherId, userId));
    await tx.delete(listings).where(eq(listings.studentId, userId));
    await tx.execute(sql`
      DELETE FROM ${messageUnlocks}
      WHERE ${messageUnlocks.studentId} = ${userId}
         OR ${messageUnlocks.teacherId} = ${userId}
    `);
    await tx.delete(studyBuddyPosts).where(eq(studyBuddyPosts.user_id, userId));
    await tx.delete(studyBuddyMessages).where(eq(studyBuddyMessages.sender, userId));
    await tx.execute(sql`
      DELETE FROM ${studyBuddyChats}
      WHERE ${studyBuddyChats.participants} @> ${JSON.stringify([userId])}::jsonb
    `);

    if (progress?.schoolId && (progress.points ?? 0) > 0) {
      await tx
        .update(schools)
        .set({
          totalPoints: sql`GREATEST(${schools.totalPoints} - ${progress.points}, 0)`,
        })
        .where(eq(schools.id, progress.schoolId));
    }

    await tx.delete(userProgress).where(eq(userProgress.userId, userId));
    await tx.update(errorLog).set({ userId: null }).where(eq(errorLog.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));

    const lingering = await tx
      .select({ c: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.id, userId));
    if ((lingering[0]?.c ?? 0) > 0) {
      throw new Error(`users row still present after purge: ${userId}`);
    }
  });
}
