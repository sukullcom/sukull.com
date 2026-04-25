import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { getTeacherProfile, getMessageUnlock } from "@/db/queries";
import { MessageTeacherButton } from "@/components/private-lesson/message-teacher-button";
import UserCreditsDisplay from "@/components/user-credits-display";
import { normalizeAvatarUrl } from "@/utils/avatar";
import {
  Banknote,
  Monitor,
  MapPin,
  BookOpen,
  Clock,
  GraduationCap,
  Users,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const teacher = await getTeacherProfile(params.id);
  if (!teacher) notFound();

  const unlock = await getMessageUnlock(user.id, teacher.id);
  const isSelf = user.id === teacher.id;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <Link
        href="/private-lesson/teachers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Öğretmenler
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white border rounded-xl p-5 text-center">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-full overflow-hidden mb-3">
              <Image
                src={normalizeAvatarUrl(teacher.avatar ?? undefined)}
                alt={teacher.name ?? "Öğretmen"}
                fill
                unoptimized={teacher.avatar?.startsWith("http") ?? false}
                className="object-cover"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              {teacher.name}
            </h1>

            {teacher.fields.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {teacher.fields.map((f, i) => (
                  <span
                    key={i}
                    className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"
                  >
                    {f.displayName}
                  </span>
                ))}
              </div>
            )}

            {!isSelf && (
              <div className="mt-4">
                <MessageTeacherButton
                  teacherId={teacher.id}
                  teacherName={teacher.name ?? undefined}
                  alreadyUnlocked={Boolean(unlock)}
                  existingChatId={unlock?.chatId ?? null}
                  fullWidth
                  variant="primary"
                  size="lg"
                />
                {!unlock && (
                  <p className="text-[11px] text-gray-500 mt-2">
                    Tek sefer 1 kredi — sohbet kalıcıdır.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-xl p-5 mt-4 space-y-3 text-sm">
            {(teacher.hourlyRateOnline != null ||
              teacher.hourlyRateInPerson != null) && (
              <div className="flex items-start gap-3">
                <Banknote className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-gray-800 mb-1">
                    Saatlik Ücret
                  </div>
                  <div className="text-gray-600 space-y-0.5">
                    {teacher.hourlyRateOnline != null && (
                      <div>Online: {teacher.hourlyRateOnline}₺</div>
                    )}
                    {teacher.hourlyRateInPerson != null && (
                      <div>Yüz yüze: {teacher.hourlyRateInPerson}₺</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {teacher.lessonMode && (
              <div className="flex items-start gap-3">
                <Monitor className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Ders Tipi</div>
                  <div className="text-gray-600">
                    {formatLessonMode(teacher.lessonMode)}
                  </div>
                </div>
              </div>
            )}

            {(teacher.city || teacher.district) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Konum</div>
                  <div className="text-gray-600">
                    {[teacher.district, teacher.city]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              </div>
            )}

            {teacher.experienceYears != null && (
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Deneyim</div>
                  <div className="text-gray-600">
                    {teacher.experienceYears} yıl
                  </div>
                </div>
              </div>
            )}

            {teacher.education && (
              <div className="flex items-start gap-3">
                <GraduationCap className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Eğitim</div>
                  <div className="text-gray-600 whitespace-pre-wrap">
                    {teacher.education}
                  </div>
                </div>
              </div>
            )}

            {teacher.targetLevels && (
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Hedef Seviye</div>
                  <div className="text-gray-600 whitespace-pre-wrap">
                    {teacher.targetLevels}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <section className="bg-white border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Hakkında</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {teacher.bio?.trim() ||
                "Bu öğretmen henüz kendisi hakkında bilgi paylaşmamış."}
            </p>
          </section>

          {teacher.availableHours && (
            <section className="bg-white border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900">
                  Müsait Olduğu Saatler
                </h2>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {teacher.availableHours}
              </p>
              <p className="text-[11px] text-gray-400 mt-2">
                Not: Bilgi amaçlıdır. Rezervasyon öğretmenle doğrudan mesajlaşma
                üzerinden yapılır.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
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
