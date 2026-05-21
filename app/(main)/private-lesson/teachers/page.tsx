import { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { getTeachersDirectory, getMessageUnlocksForStudent } from "@/db/queries";
import { MessageTeacherButton } from "@/components/private-lesson/message-teacher-button";
import UserCreditsDisplay from "@/components/user-credits-display";
import { normalizeAvatarUrl } from "@/utils/avatar";
import {
  MapPin,
  Banknote,
  Monitor,
  Users,
  GraduationCap,
  Building2,
} from "lucide-react";
import { TeachersDirectoryFilters } from "./_components/teachers-directory-filters";
import {
  matchesAllTokens,
  normalizeForSearch,
} from "@/lib/turkish-locale";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  field?: string;
  lessonMode?: string;
  city?: string;
  university?: string;
};

export default async function TeachersDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const teachers = await getTeachersDirectory();

  // Öğrenci→öğretmen unlock haritasını **tek sorgu** ile çek.
  // Önceki sürüm her satır için ayrı `getMessageUnlock` (N+1) yapıyordu;
  // eğitmen sayısı büyüdükçe sayfa belirgin yavaşlıyor + pool baskısı
  // oluşturuyordu. Bulk lookup, "Mesaj Gönder" butonunun açılmış sohbete
  // doğrudan götürme davranışı aynen kalıyor.
  const unlockMap = await getMessageUnlocksForStudent(
    user.id,
    teachers.map((t) => t.id),
  );

  const fieldFilter = searchParams.field ?? "";
  const lessonModeFilter = searchParams.lessonMode ?? "";
  const cityFilter = searchParams.city ?? "";
  const universityFilter = searchParams.university ?? "";
  const freeQuery = searchParams.q ?? "";

  const filtered = teachers.filter((t) => {
    if (fieldFilter) {
      const fields = [t.field, ...(t.fields ?? [])];
      if (!matchesAllTokens(fieldFilter, fields)) return false;
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
      // Şehir kıyaslamasını Türkçe locale + diakritik-katlama ile yap:
      // "İstanbul" / "istanbul" / "ISTANBUL" / "Istanbul" hepsi eşleşmeli.
      const cityHay = normalizeForSearch(t.city);
      const cityNeedle = normalizeForSearch(cityFilter);
      if (!cityHay.includes(cityNeedle)) return false;
    }
    if (universityFilter) {
      const uniHay = normalizeForSearch(t.university);
      const uniNeedle = normalizeForSearch(universityFilter);
      if (!uniHay.includes(uniNeedle)) return false;
    }
    if (freeQuery) {
      // Genel arama: tek bir kutudan ad, branş, şehir, üniversite, bölüm
      // alanlarının tümünde token-bazlı arama yap. Kullanıcı "ankara fizik"
      // yazdığında her iki token da en az bir alanda geçmelidir.
      const haystacks = [
        t.name,
        t.field,
        ...(t.fields ?? []),
        t.city,
        t.district,
        t.university,
        t.universityDepartment,
        t.bio,
      ];
      if (!matchesAllTokens(freeQuery, haystacks)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-suk-brand-soft rounded-lg">
            <GraduationCap className="h-5 w-5 text-suk-brand" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Eğitmenler
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Sukull tarafından onaylanmış eğitmenlerin listesi. Saatlik ücretleri
          görebilir, 1 kullanım hakkı ile mesajlaşmayı açabilirsin — tek seferlik ödeme,
          sohbet kalıcıdır ve hak iade edilmez. Onay sonrası tarafların kayıtlı
          e-posta ve telefon bilgileri sohbet üzerinden paylaşılır.
        </p>
      </div>

      <Suspense
        fallback={
          <div
            className="mb-4 h-24 w-full animate-pulse rounded-xl border border-border bg-muted/50"
            aria-hidden
          />
        }
      >
        <TeachersDirectoryFilters
          initialQuery={freeQuery}
          initialField={fieldFilter}
          initialLessonMode={lessonModeFilter}
          initialCity={cityFilter}
          initialUniversity={universityFilter}
          resultCount={filtered.length}
          totalCount={teachers.length}
        />
      </Suspense>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            Filtrelere uyan eğitmen bulunamadı.
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
                className="bg-card border rounded-xl p-4 hover:border-suk-brand/35 hover:shadow-sm transition-all"
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
                      className="font-semibold text-foreground hover:text-suk-brand transition-colors line-clamp-1"
                    >
                      {t.name}
                    </Link>
                    {t.fields.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.fields.slice(0, 3).map((f, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-suk-brand-soft text-suk-brand-border px-2 py-0.5 rounded-full font-medium"
                          >
                            {f}
                          </span>
                        ))}
                        {t.fields.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{t.fields.length - 3}
                          </span>
                        )}
                      </div>
                    ) : t.field ? (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {t.field}
                      </div>
                    ) : null}

                    <div className="mt-2 space-y-1">
                      {(t.hourlyRateOnline || t.hourlyRateInPerson) && (
                        <div className="flex items-center gap-2 text-xs text-foreground/90">
                          <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">
                            {formatRates(
                              t.hourlyRateOnline,
                              t.hourlyRateInPerson,
                            )}
                          </span>
                        </div>
                      )}
                      {t.lessonMode && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatLessonMode(t.lessonMode)}
                        </div>
                      )}
                      {(t.city || t.district) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {[t.district, t.city].filter(Boolean).join(", ")}
                        </div>
                      )}
                      {(t.university || t.universityDepartment) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="line-clamp-1">
                            {[t.university, t.universityDepartment]
                              .filter(Boolean)
                              .join(" — ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/private-lesson/teachers/${t.id}`}
                    className="flex-1 inline-flex items-center justify-center text-sm font-medium text-foreground border rounded-lg px-3 py-2 hover:bg-muted/60 transition-colors"
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
