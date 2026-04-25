import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { studyBuddyChats, studyBuddyMessages, users } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { normalizeAvatarUrl } from "@/utils/avatar";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { ChatThread } from "./_components/chat-thread";
import { PrivateLessonContactStrip } from "@/components/private-lesson/private-lesson-contact-strip";

export const dynamic = "force-dynamic";

/**
 * Single-thread view for private-lesson messaging. This reuses the
 * study_buddy_chats / study_buddy_messages tables — they're just a
 * 1:1 message store keyed by a participants array. Access is
 * authorized by simple participation check; the pre-pay
 * (`message_unlocks`) gate happens on the initial unlock, not here.
 */
export default async function MessageThreadPage({
  params,
}: {
  params: { chatId: string };
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const chatId = Number.parseInt(params.chatId, 10);
  if (!Number.isFinite(chatId) || chatId <= 0) notFound();

  const chat = await db.query.studyBuddyChats.findFirst({
    where: eq(studyBuddyChats.id, chatId),
    columns: { id: true, participants: true },
  });
  if (!chat) notFound();
  if (!(chat.participants ?? []).includes(user.id)) {
    redirect("/private-lesson/messages");
  }

  const otherId =
    (chat.participants ?? []).find((p) => p !== user.id) ?? null;

  const otherProfile = otherId
    ? await db.query.users.findFirst({
        where: eq(users.id, otherId),
        columns: { id: true, name: true, avatar: true, role: true },
      })
    : null;

  const messages = await db
    .select({
      id: studyBuddyMessages.id,
      sender: studyBuddyMessages.sender,
      content: studyBuddyMessages.content,
      createdAt: studyBuddyMessages.created_at,
    })
    .from(studyBuddyMessages)
    .where(eq(studyBuddyMessages.chat_id, chatId))
    .orderBy(asc(studyBuddyMessages.created_at))
    .limit(500);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-6 sm:pb-8 min-h-0">
      <Link
        href="/private-lesson/messages"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 my-3"
      >
        <ArrowLeft className="h-4 w-4" /> Mesajlar
      </Link>

      <div
        className="bg-white border rounded-xl overflow-hidden flex flex-col min-h-0
        h-[min(720px,calc(100dvh-12rem-var(--app-bottom-inset)))] lg:h-[min(720px,calc(100dvh-12rem))] w-full"
      >
        <div className="border-b bg-gray-50 px-4 py-3 flex items-center gap-3 shrink-0">
          <Image
            src={normalizeAvatarUrl(otherProfile?.avatar ?? undefined)}
            alt={otherProfile?.name ?? "Kullanıcı"}
            width={36}
            height={36}
            unoptimized={otherProfile?.avatar?.startsWith("http") ?? false}
            className="rounded-full object-cover w-9 h-9"
          />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {otherProfile?.name ?? "Kullanıcı"}
            </div>
            <div className="text-[11px] text-gray-400">
              {otherProfile?.role === "teacher" ? "Öğretmen" : "Öğrenci"}
            </div>
          </div>
          {otherProfile?.role === "teacher" && (
            <Link
              href={`/private-lesson/teachers/${otherProfile.id}`}
              className="ml-auto text-xs text-green-700 hover:underline"
            >
              Profili Gör
            </Link>
          )}
        </div>

        <PrivateLessonContactStrip chatId={chatId} />

        <ChatThread
          chatId={chatId}
          currentUserId={user.id}
          initialMessages={messages.map((m) => ({
            id: m.id,
            sender: m.sender,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
