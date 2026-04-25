import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { getTeachersDirectory, getMessageUnlock } from "@/db/queries";
import { MessageTeacherButton } from "@/components/private-lesson/message-teacher-button";
import UserCreditsDisplay from "@/components/user-credits-display";
import { normalizeAvatarUrl } from "@/utils/avatar";
import { MapPin, Banknote, Monitor, Users, GraduationCap } from "lucide-react";
import { TeachersDirectoryFilters } from "./_components/teachers-directory-filters";

export const dynamic = "force-dynamic";

type SearchParams = {
  field?: string;
  lessonMode?: string;
  city?: string;
};

export default async function TeachersDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const teachers = await getTeachersDirectory();

  // We pre-compute the student→teacher unlock map so the "Mesaj Gönder"
  // button can skip the confirm dialog for threads already paid for.
  // For very large directories this is an O(N) set of unlock lookups,
  // but the student typically has < 10 unlocked threads total so the
  // branch is cheap in practice.
  const unlockChecks = await Promise.all(
    teachers.map((t) => getMessageUnlock(user.id, t.id)),
  );
  const unlockMap = new Map<string, { chatId: number | null }>();
  teachers.forEach((t, i) => {
    const row = unlockChecks[i];
    if (row) unlockMap.set(t.id, { chatId: row.chatId ?? null });
  });

  const fieldFilter = searchParams.field?.toLowerCase() ?? "";
  const lessonModeFilter = searchParams.lessonMode ?? "";
  const cityFilter = searchParams.city?.toLowerCase() ?? "";

  const filtered = teachers.filter((t) => {
    if (fieldFilter) {
      const haystack = [t.field, ...(t.fields ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(fieldFilter)) return false;
    }
    if (lessonModeFilter) {
      if (
        t.lessonMode &&
        t.lessonMode !== "both" &&
        t.lessonMode !== lessonModeFilter
      ) {
        return false;
      }
    }
    if (cityFilter) {
      if (!t.city || !t.city.toLowerCase().includes(cityFilter)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <GraduationCap className="h-5 w-5 text-green-700" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Öğretmenler
          </h1>
        </div>
        <p className="text-sm text-gray-600">
          Onaylı öğretmenlerin listesi. Saatlik ücretlerini görebilir, 1 kredi
          ile mesajlaşmayı açabilirsin — tek seferlik ödeme, sohbet kalıcıdır.
        </p>
      </div>

      <TeachersDirectoryFilters
        initialField={searchParams.field ?? ""}
        initialLessonMode={lessonModeFilter}
        initialCity={searchParams.city ?? ""}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 bg-white">
          <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">
            Filtrelere uyan öğretmen bulunamadı.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const unlock = unlockMap.get(t.id);
            const alreadyUnlocked = Boolean(unlock);
            return (
              <div
                key={t.id}
                className="bg-white border rounded-xl p-4 hover:border-green-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <Link
                    href={`/private-lesson/teachers/${t.id}`}
                    className="shrink-0"
                  >
                    <Image
                      src={normalizeAvatarUrl(t.avatar ?? undefined)}
                      alt={t.name}
                      width={56}
                      height={56}
                      unoptimized={t.avatar?.startsWith("http") ?? false}
                      className="rounded-full object-cover w-14 h-14"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/private-lesson/teachers/${t.id}`}
                      className="font-semibold text-gray-900 hover:text-green-700 transition-colors line-clamp-1"
                    >
                      {t.name}
                    </Link>
                    {t.fields.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.fields.slice(0, 3).map((f, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"
                          >
                            {f}
                          </span>
                        ))}
                        {t.fields.length > 3 && (
                          <span className="text-[10px] text-gray-400">
                            +{t.fields.length - 3}
                          </span>
                        )}
                      </div>
                    ) : t.field ? (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {t.field}
                      </div>
                    ) : null}

                    <div className="mt-2 space-y-1">
                      {(t.hourlyRateOnline || t.hourlyRateInPerson) && (
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Banknote className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium">
                            {formatRates(
                              t.hourlyRateOnline,
                              t.hourlyRateInPerson,
                            )}
                          </span>
                        </div>
                      )}
                      {t.lessonMode && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Monitor className="h-3.5 w-3.5 text-gray-400" />
                          {formatLessonMode(t.lessonMode)}
                        </div>
                      )}
                      {(t.city || t.district) && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {[t.district, t.city].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/private-lesson/teachers/${t.id}`}
                    className="flex-1 inline-flex items-center justify-center text-sm font-medium text-gray-700 border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    Profili Gör
                  </Link>
                  {t.id !== user.id && (
                    <MessageTeacherButton
                      teacherId={t.id}
                      teacherName={t.name}
                      alreadyUnlocked={alreadyUnlocked}
                      existingChatId={unlock?.chatId ?? null}
                      size="default"
                      variant="primary"
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatRates(online: number | null, inPerson: number | null): string {
  const parts: string[] = [];
  if (online != null) parts.push(`Online ${online}₺/saat`);
  if (inPerson != null) parts.push(`Yüz yüze ${inPerson}₺/saat`);
  return parts.length > 0 ? parts.join(" • ") : "Ücret belirtilmemiş";
}

function formatLessonMode(mode: string): string {
  switch (mode) {
    case "online":
      return "Sadece online";
    case "in_person":
      return "Sadece yüz yüze";
    case "both":
      return "Online & yüz yüze";
    default:
      return mode;
  }
}
