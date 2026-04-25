import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { listStudentConversations } from "@/db/queries";
import UserCreditsDisplay from "@/components/user-credits-display";
import { normalizeAvatarUrl } from "@/utils/avatar";
import { MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MessagesIndexPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const conversations = await listStudentConversations(user.id);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-purple-100 rounded-lg">
            <MessageCircle className="h-5 w-5 text-purple-700" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Mesajlar
          </h1>
        </div>
        <p className="text-sm text-gray-600">
          Öğretmenlerle açılmış sohbetlerin. Öğrenci olarak sohbet açmak için
          tek sefer 1 kredi harcanır; sonrasında mesajlaşma ücretsizdir.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 bg-white">
          <MessageCircle className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">
            Henüz sohbetin yok. Öğretmen rehberinden bir öğretmene ulaşmayı
            dene.
          </p>
          <Link
            href="/private-lesson/teachers"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Öğretmenlere Göz At
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          {conversations.map((c, i) => (
            <Link
              key={c.chatId}
              href={`/private-lesson/messages/${c.chatId}`}
              className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                i !== conversations.length - 1 ? "border-b" : ""
              }`}
            >
              <Image
                src={normalizeAvatarUrl(c.otherUserAvatar ?? undefined)}
                alt={c.otherUserName || "Kullanıcı"}
                width={44}
                height={44}
                unoptimized={c.otherUserAvatar?.startsWith("http") ?? false}
                className="rounded-full object-cover w-11 h-11 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {c.otherUserName || "Kullanıcı"}
                  </h3>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {formatDate(c.lastUpdated)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {c.lastMessage || "Henüz mesaj yok"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}
