import { desc } from "drizzle-orm";

import db from "@/db/drizzle";
import { instagramLiveComments, instagramWebhookEvents } from "@/db/schema";
import type { InstagramCommentEvent } from "@/lib/instagram/webhook";

/** Aynı yorum ikinci kez gelirse (Meta yeniden dener) satır çoğalmaz. */
export async function saveInstagramComment(event: InstagramCommentEvent): Promise<void> {
  await db
    .insert(instagramLiveComments)
    .values({
      commentId: event.commentId,
      field: event.field,
      body: event.text,
      username: event.username,
      commenterId: event.commenterId,
      mediaId: event.mediaId,
      mediaProductType: event.mediaProductType,
      accountId: event.accountId,
      parentId: event.parentId,
      eventTime: event.eventTime,
    })
    .onConflictDoNothing({ target: instagramLiveComments.commentId });
}

export async function listRecentInstagramComments(limit = 50) {
  return db
    .select({
      id: instagramLiveComments.id,
      field: instagramLiveComments.field,
      body: instagramLiveComments.body,
      username: instagramLiveComments.username,
      mediaProductType: instagramLiveComments.mediaProductType,
      receivedAt: instagramLiveComments.receivedAt,
    })
    .from(instagramLiveComments)
    .orderBy(desc(instagramLiveComments.receivedAt))
    .limit(limit);
}

export async function recordInstagramWebhookEvent(
  outcome: string,
  commentCount: number,
  note: string,
): Promise<void> {
  await db.insert(instagramWebhookEvents).values({
    outcome,
    commentCount,
    note: note.slice(0, 300),
  });
}

export async function listRecentInstagramWebhookEvents(limit = 8) {
  return db
    .select({
      id: instagramWebhookEvents.id,
      outcome: instagramWebhookEvents.outcome,
      commentCount: instagramWebhookEvents.commentCount,
      note: instagramWebhookEvents.note,
      receivedAt: instagramWebhookEvents.receivedAt,
    })
    .from(instagramWebhookEvents)
    .orderBy(desc(instagramWebhookEvents.receivedAt))
    .limit(limit);
}
