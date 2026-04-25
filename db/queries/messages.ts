/**
 * Student ↔ teacher messaging, built on top of the existing study-buddy
 * chat tables. A student must first "unlock" a thread with a teacher
 * by spending one credit (`unlockMessageThread`). After that the same
 * chat row is reused forever — no per-message charge.
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import {
  creditUsage,
  messageUnlocks,
  studyBuddyChats,
  studyBuddyMessages,
  userCredits,
  users,
} from "@/db/schema";
import { queryResultRows } from "@/lib/query-result";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getMessageUnlock(studentId: string, teacherId: string) {
  return db.query.messageUnlocks.findFirst({
    where: and(
      eq(messageUnlocks.studentId, studentId),
      eq(messageUnlocks.teacherId, teacherId),
    ),
  });
}

export type ConversationRow = {
  chatId: number;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string;
  lastUpdated: string;
};

async function listConversationsFor(userId: string): Promise<ConversationRow[]> {
  // Pull chats that contain this user in the `participants` jsonb array,
  // plus the other participant's profile. study_buddy_chats only has
  // 2-person threads in our UI so we simplify by taking the first
  // non-self id.
  const raw = await db.execute(sql`
    SELECT
      c.id,
      c.participants,
      c.last_message,
      c.last_updated
    FROM study_buddy_chats c
    WHERE c.participants @> ${JSON.stringify([userId])}::jsonb
    ORDER BY c.last_updated DESC
    LIMIT 200
  `);

  const chats = queryResultRows<{
    id: number;
    participants: string[] | null;
    last_message: string | null;
    last_updated: string | Date;
  }>(raw);

  const otherIds = new Set<string>();
  for (const chat of chats) {
    const participants = Array.isArray(chat.participants)
      ? chat.participants
      : [];
    for (const p of participants) {
      if (p !== userId) otherIds.add(p);
    }
  }
  const otherIdList = Array.from(otherIds);

  const profiles = otherIdList.length
    ? await db.query.users.findMany({
        where: inArray(users.id, otherIdList),
        columns: { id: true, name: true, avatar: true },
      })
    : [];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return chats.map((c) => {
    const participants = Array.isArray(c.participants) ? c.participants : [];
    const otherId = participants.find((p) => p !== userId) ?? "";
    const profile = profileMap.get(otherId);
    return {
      chatId: c.id,
      otherUserId: otherId,
      otherUserName: profile?.name ?? "",
      otherUserAvatar: profile?.avatar ?? null,
      lastMessage: c.last_message ?? "",
      lastUpdated: new Date(c.last_updated as string | number | Date).toISOString(),
    };
  });
}

export const listStudentConversations = listConversationsFor;
export const listTeacherConversations = listConversationsFor;

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type UnlockResult =
  | { ok: true; chatId: number; alreadyUnlocked: boolean }
  | {
      ok: false;
      code:
        | "self_unlock_forbidden"
        | "teacher_not_found"
        | "insufficient_credits"
        | "unknown";
      message?: string;
    };

/**
 * Consume one credit from the student and open (or re-open) a chat
 * with the given teacher. Idempotent: if the pair was already
 * unlocked, returns the existing chatId without charging again.
 */
export async function unlockMessageThread(input: {
  studentId: string;
  teacherId: string;
}): Promise<UnlockResult> {
  if (input.studentId === input.teacherId) {
    return { ok: false, code: "self_unlock_forbidden" };
  }

  try {
    return await db.transaction(async (tx) => {
      const teacher = await tx.query.users.findFirst({
        where: eq(users.id, input.teacherId),
        columns: { id: true, role: true },
      });
      if (!teacher || teacher.role !== "teacher") {
        return { ok: false as const, code: "teacher_not_found" as const };
      }

      const existing = await tx.query.messageUnlocks.findFirst({
        where: and(
          eq(messageUnlocks.studentId, input.studentId),
          eq(messageUnlocks.teacherId, input.teacherId),
        ),
      });

      if (existing) {
        const chatId =
          existing.chatId ??
          (await ensureChat(tx, input.studentId, input.teacherId));
        if (!existing.chatId) {
          await tx
            .update(messageUnlocks)
            .set({ chatId })
            .where(eq(messageUnlocks.id, existing.id));
        }
        return {
          ok: true as const,
          chatId,
          alreadyUnlocked: true,
        };
      }

      const creditResult = await tx
        .update(userCredits)
        .set({
          usedCredits: sql`${userCredits.usedCredits} + 1`,
          availableCredits: sql`${userCredits.availableCredits} - 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userCredits.userId, input.studentId),
            sql`${userCredits.availableCredits} >= 1`,
          ),
        )
        .returning({ id: userCredits.id });

      if (creditResult.length === 0) {
        return {
          ok: false as const,
          code: "insufficient_credits" as const,
        };
      }

      const chatId = await ensureChat(tx, input.studentId, input.teacherId);

      await tx.insert(messageUnlocks).values({
        studentId: input.studentId,
        teacherId: input.teacherId,
        chatId,
      });

      await tx.insert(creditUsage).values({
        userId: input.studentId,
        reason: "message_unlock",
        creditsUsed: 1,
        refType: "teacher",
        refId: input.teacherId,
      });

      return { ok: true as const, chatId, alreadyUnlocked: false };
    });
  } catch (err) {
    return {
      ok: false,
      code: "unknown",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Locate an existing 2-person chat between (student, teacher) in
 * `study_buddy_chats`, or create one. The `participants` array is
 * stored sorted so we can look it up deterministically.
 */
async function ensureChat(
  tx: TxClient,
  studentId: string,
  teacherId: string,
): Promise<number> {
  const pair = [studentId, teacherId].sort();

  const existing = await tx.execute(sql`
    SELECT id
    FROM study_buddy_chats
    WHERE participants @> ${JSON.stringify(pair)}::jsonb
      AND jsonb_array_length(participants) = 2
    LIMIT 1
  `);
  const rows = queryResultRows<{ id: number }>(existing);
  if (rows[0]?.id) return Number(rows[0].id);

  const [created] = await tx
    .insert(studyBuddyChats)
    .values({
      participants: pair,
      last_message: "",
    })
    .returning({ id: studyBuddyChats.id });
  return created.id;
}

/**
 * When a teacher spends 1 credit on a listing offer, we open the same
 * student–teacher 1:1 thread as a paid message unlock (no second credit).
 * The student can reply without accepting the offer; either side can use
 * the thread immediately.
 */
export async function ensureUnlockedThreadForOfferTx(
  tx: TxClient,
  input: { studentId: string; teacherId: string },
): Promise<{ chatId: number }> {
  if (input.studentId === input.teacherId) {
    throw new Error("self_pair_forbidden");
  }

  const chatId = await ensureChat(tx, input.studentId, input.teacherId);

  const existing = await tx.query.messageUnlocks.findFirst({
    where: and(
      eq(messageUnlocks.studentId, input.studentId),
      eq(messageUnlocks.teacherId, input.teacherId),
    ),
  });

  if (existing) {
    if (existing.chatId == null) {
      await tx
        .update(messageUnlocks)
        .set({ chatId })
        .where(eq(messageUnlocks.id, existing.id));
    }
    return { chatId };
  }

  await tx.insert(messageUnlocks).values({
    studentId: input.studentId,
    teacherId: input.teacherId,
    chatId,
  });
  return { chatId };
}

// ---------------------------------------------------------------------------
// Message write helper
// ---------------------------------------------------------------------------

export async function sendMessageInUnlockedThread(input: {
  senderId: string;
  chatId: number;
  content: string;
}) {
  return await db.transaction(async (tx) => {
    const chat = await tx.query.studyBuddyChats.findFirst({
      where: eq(studyBuddyChats.id, input.chatId),
      columns: { id: true, participants: true },
    });
    if (!chat) throw new Error("chat_not_found");
    if (!(chat.participants ?? []).includes(input.senderId)) {
      throw new Error("chat_forbidden");
    }

    const [msg] = await tx
      .insert(studyBuddyMessages)
      .values({
        chat_id: input.chatId,
        sender: input.senderId,
        content: input.content,
      })
      .returning();

    await tx
      .update(studyBuddyChats)
      .set({ last_message: input.content.slice(0, 160), last_updated: new Date() })
      .where(eq(studyBuddyChats.id, input.chatId));

    return msg;
  });
}
