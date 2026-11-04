import db from "@/db/drizzle";
import { instagramLiveComments } from "@/db/schema";
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
