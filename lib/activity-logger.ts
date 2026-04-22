import db from "@/db/drizzle";
import { activityLog } from "@/db/schema";

type EventType = "page_view" | "game_start" | "game_end" | "lesson_complete" | "shop_purchase" | "login";

interface LogOptions {
  userId: string;
  eventType: EventType;
  page?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity({ userId, eventType, page, metadata }: LogOptions) {
  try {
    await db.insert(activityLog).values({
      userId,
      eventType,
      page: page || null,
      metadata: metadata ?? null,
    });
  } catch {
    // Fire-and-forget: don't break the main flow
  }
}
