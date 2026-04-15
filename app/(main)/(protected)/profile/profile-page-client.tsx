"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { ProfileSchoolSelector } from "./profile-school-selector";
import { AvatarGenerator } from "random-avatar-generator";
import Image from "next/image";
import { School } from "@/app/types";
import { normalizeAvatarUrl } from "@/utils/avatar";
import StreakCalendarAdvanced from "@/components/streak-calendar";
import {
  checkStreakRequirement,
  getStreakRequirementMessage,
  STREAK_REQUIREMENTS,
} from "@/utils/streak-requirements";
import type { ProfileAnalyticsData } from "@/actions/profile-analytics";
import {
  BarChart3,
  Settings,
  Trophy,
  Target,
  Zap,
  BookOpen,
  TrendingUp,
  Lock,
  LogOut,
} from "lucide-react";
import { useSecureLogout } from "@/hooks/use-secure-logout";

type ProfileProps = {
  userName: string;
  userImageSrc: string;
  schoolId: number | null;
  istikrar: number;
  dailyTarget: number;
  startDate: string;
  profileEditingUnlocked?: boolean;
  studyBuddyUnlocked?: boolean;
  codeShareUnlocked?: boolean;
};

export default function ProfilePageClient({
  profile,
  allSchools,
  analytics,
}: {
  profile: ProfileProps;
  allSchools: School[];
  analytics: ProfileAnalyticsData | null;
}) {
  const [activeTab, setActiveTab] = useState<"analytics" | "settings">("analytics");
  const [username, setUsername] = useState(profile.userName || "Anonymous");
  const [avatarUrl, setAvatarUrl] = useState(normalizeAvatarUrl(profile.userImageSrc));
  const [dailyTarget, setDailyTarget] = useState(profile.dailyTarget || 50);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(profile.schoolId ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { logout, isLoggingOut } = useSecureLogout();

  const userAchievements = {
    profileEditingUnlocked: profile.profileEditingUnlocked,
    studyBuddyUnlocked: profile.studyBuddyUnlocked,
    codeShareUnlocked: profile.codeShareUnlocked,
  };

  const canChangeUsername = checkStreakRequirement(profile.istikrar, "USERNAME_CHANGE", userAchievements);
  const canChangeDailyGoal = checkStreakRequirement(profile.istikrar, "DAILY_GOAL_CHANGE", userAchievements);
  const canChangeAvatar = checkStreakRequirement(profile.istikrar, "AVATAR_CHANGE", userAchievements);
  const canSelectSchool = checkStreakRequirement(profile.istikrar, "SCHOOL_SELECTION", userAchievements);

  const generator = useMemo(() => new AvatarGenerator(), []);
  const isExternalAvatar = avatarUrl.startsWith("http");

  const handleRandomAvatar = useCallback(() => {
    if (!canChangeAvatar) {
      toast.error(getStreakRequirementMessage("AVATAR_CHANGE"));
      return;
    }
    try {
      setAvatarUrl(generator.generateRandomAvatar());
      toast.success("Yeni avatar oluşturuldu!");
    } catch {
      toast.error("Avatar oluşturulurken bir hata oluştu.");
    }
  }, [generator, canChangeAvatar]);

  const handleSave = useCallback(() => {
    setError(null);
    if (username.trim() !== profile.userName && !canChangeUsername) {
      toast.error(getStreakRequirementMessage("USERNAME_CHANGE"));
      return;
    }
    if (avatarUrl !== profile.userImageSrc && !canChangeAvatar) {
      toast.error(getStreakRequirementMessage("AVATAR_CHANGE"));
      return;
    }
    if (dailyTarget !== profile.dailyTarget && !canChangeDailyGoal) {
      toast.error(getStreakRequirementMessage("DAILY_GOAL_CHANGE"));
      return;
    }
    if (selectedSchoolId !== profile.schoolId && !canSelectSchool) {
      toast.error(getStreakRequirementMessage("SCHOOL_SELECTION"));
      return;
    }
    if (!username.trim()) {
      setError("Kullanıcı adı boş olamaz.");
      return;
    }

    let schoolToSave = profile.schoolId;
    if (selectedSchoolId !== profile.schoolId) {
      if (!canSelectSchool) return;
      schoolToSave = selectedSchoolId;
    }
    if (!profile.schoolId && !selectedSchoolId && canSelectSchool) {
      setError("Lütfen bir okul seçin!");
      return;
    }

    startTransition(() => {
      updateProfileAction(username.trim(), avatarUrl, schoolToSave, dailyTarget)
        .then(() => toast.success("Profil güncellendi!"))
        .catch((err) => {
          setError(err.message || "Profil güncellenirken hata oluştu.");
          toast.error(err.message || "Profil güncellenirken hata oluştu.");
        });
    });
  }, [username, avatarUrl, selectedSchoolId, dailyTarget, canChangeUsername, canChangeAvatar, canChangeDailyGoal, canSelectSchool, profile]);

  const dailyTargetOptions = useMemo(
    () => [25, 50, 75, 100, 150, 200, 250, 300].map((v) => ({ value: v, label: `${v} puan` })),
    []
  );

  const s = analytics?.summary;

  return (
    <div className="flex flex-row-reverse gap-[48px] px-3 sm:px-6">
      <div className="flex-1 pb-10">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
            <Image
              src={avatarUrl}
              alt="Avatar"
              fill
              sizes="96px"
              className="rounded-full object-cover border-4 border-white shadow-lg"
              priority
              unoptimized={isExternalAvatar}
              onError={() => setAvatarUrl(normalizeAvatarUrl(null))}
            />
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {profile.userName}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-sm text-amber-600">
                <Zap className="h-4 w-4" />
                <span className="font-semibold">{profile.istikrar} gün</span>
              </div>
              {s && (
                <>
                  <div className="flex items-center gap-1.5 text-sm text-blue-600">
                    <Trophy className="h-4 w-4" />
                    <span className="font-semibold">{s.totalPoints.toLocaleString("tr-TR")} puan</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-green-600">
                    <Target className="h-4 w-4" />
                    <span className="font-semibold">%{s.overallAccuracy} doğruluk</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-6">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "analytics"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            <BarChart3 className="h-4 w-4" />
            Analiz
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "settings"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="h-4 w-4" />
            Ayarlar
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {s && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryCard icon={<BookOpen className="h-5 w-5" />} label="Başlanan Kurs" value={s.totalCoursesStarted} color="blue" />
                <SummaryCard icon={<Trophy className="h-5 w-5" />} label="Tamamlanan" value={s.totalCoursesCompleted} color="green" />
                <SummaryCard icon={<Target className="h-5 w-5" />} label="Çözülen Soru" value={s.totalChallengesCompleted} color="purple" />
                <SummaryCard icon={<Zap className="h-5 w-5" />} label="Aktif Gün" value={s.daysActive} color="amber" />
              </div>
            )}

            {/* Subject Performance */}
            {analytics && analytics.subjectAnalytics.length > 0 && (
              <div className="bg-white border rounded-xl p-4 sm:p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Konu Bazlı Performans
                </h3>
                <div className="space-y-3">
                  {analytics.subjectAnalytics.map((sub) => (
                    <SubjectBar key={sub.subject} subject={sub} />
                  ))}
                </div>
              </div>
            )}

            {/* Course Progress */}
            {analytics && analytics.courseAnalytics.length > 0 && (
              <div className="bg-white border rounded-xl p-4 sm:p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  Kurs İlerlemesi
                </h3>
                <div className="space-y-3">
                  {analytics.courseAnalytics.map((c) => {
                    const pct = c.totalChallenges > 0
                      ? Math.round((c.completedChallenges / c.totalChallenges) * 100)
                      : 0;
                    return (
                      <div key={c.courseId} className="flex items-center gap-3">
                        <Image
                          src={c.courseImageSrc}
                          alt={c.courseTitle}
                          width={36}
                          height={36}
                          className="rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs sm:text-sm font-medium text-gray-700 truncate pr-2">
                              {c.courseTitle}
                            </span>
                            <span className="text-xs font-bold text-gray-500 shrink-0">
                              %{pct}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct === 100 ? "bg-green-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[10px] text-gray-400">
                              {c.completedChallenges}/{c.totalChallenges} soru
                            </span>
                            <span className="text-[10px] text-gray-400">
                              %{c.accuracy} doğruluk
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Difficulty & Type Breakdown */}
            {analytics && (analytics.difficultyAnalytics.length > 0 || analytics.typeAnalytics.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analytics.difficultyAnalytics.length > 0 && (
                  <div className="bg-white border rounded-xl p-4">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm">Zorluk Dağılımı</h3>
                    <div className="space-y-2">
                      {analytics.difficultyAnalytics.map((d) => (
                        <div key={d.difficulty} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{d.difficulty}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{d.total} soru</span>
                            <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                              d.accuracy >= 80 ? "bg-green-100 text-green-700" :
                              d.accuracy >= 50 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              %{d.accuracy}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analytics.typeAnalytics.length > 0 && (
                  <div className="bg-white border rounded-xl p-4">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm">Soru Türü Dağılımı</h3>
                    <div className="space-y-2">
                      {analytics.typeAnalytics.map((t) => (
                        <div key={t.type} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 text-xs">{t.type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{t.total}</span>
                            <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                              t.accuracy >= 80 ? "bg-green-100 text-green-700" :
                              t.accuracy >= 50 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              %{t.accuracy}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Streak Calendar */}
            <div className="bg-white border rounded-xl p-4 sm:p-5">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                İstikrar Takvimi
              </h3>
              <StreakCalendarAdvanced startDate={profile.startDate} />
            </div>

            {/* Empty state */}
            {(!analytics || analytics.courseAnalytics.length === 0) && (
              <div className="bg-white border rounded-xl p-8 text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 font-medium">Henüz analiz verisi yok</p>
                <p className="text-xs text-gray-400 mt-1">Derslerden soru çözdükçe burada istatistiklerini göreceksin.</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-xl mx-auto border rounded-xl p-5 sm:p-6 space-y-5 bg-white">
            {error && (
              <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            {/* Avatar */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-28 h-28 overflow-hidden rounded-full relative">
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  sizes="112px"
                  className="object-cover"
                  priority
                  unoptimized={isExternalAvatar}
                  onError={() => setAvatarUrl(normalizeAvatarUrl(null))}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRandomAvatar}
                disabled={pending || !canChangeAvatar}
              >
                Rastgele Avatar Oluştur
              </Button>
              {!canChangeAvatar && (
                <LockedHint days={STREAK_REQUIREMENTS.AVATAR_CHANGE} label="Avatar değiştirmek" />
              )}
            </div>

            {/* Username */}
            <FieldGroup label="Kullanıcı Adı" locked={!canChangeUsername} days={STREAK_REQUIREMENTS.USERNAME_CHANGE} lockLabel="Kullanıcı adı değiştirmek">
              <input
                className={`w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-1 ${
                  !canChangeUsername
                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                value={username}
                onChange={(e) => canChangeUsername && setUsername(e.target.value)}
                maxLength={30}
                disabled={!canChangeUsername}
              />
            </FieldGroup>

            {/* Daily Target */}
            <FieldGroup label="Günlük Hedef" locked={!canChangeDailyGoal} days={STREAK_REQUIREMENTS.DAILY_GOAL_CHANGE} lockLabel="Günlük hedef değiştirmek">
              <select
                className={`w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-1 ${
                  !canChangeDailyGoal
                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                value={dailyTarget}
                onChange={(e) => canChangeDailyGoal && setDailyTarget(parseInt(e.target.value))}
                disabled={!canChangeDailyGoal}
              >
                {dailyTargetOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FieldGroup>

            {/* School */}
            <FieldGroup label="Okul" locked={!canSelectSchool} days={STREAK_REQUIREMENTS.SCHOOL_SELECTION} lockLabel="Okul seçmek">
              <div className={!canSelectSchool ? "opacity-50 pointer-events-none" : ""}>
                <ProfileSchoolSelector
                  schools={allSchools}
                  initialSchoolId={selectedSchoolId}
                  onSelect={(id) => canSelectSchool && setSelectedSchoolId(id)}
                />
              </div>
            </FieldGroup>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSave}
              disabled={pending || !username.trim()}
            >
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>

            {/* Feature Unlock Status */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Özellik Durumu</h3>
              <UnlockRow label="Kullanıcı Adı" unlocked={canChangeUsername} req={STREAK_REQUIREMENTS.USERNAME_CHANGE} />
              <UnlockRow label="Günlük Hedef" unlocked={canChangeDailyGoal} req={STREAK_REQUIREMENTS.DAILY_GOAL_CHANGE} />
              <UnlockRow label="Avatar" unlocked={canChangeAvatar} req={STREAK_REQUIREMENTS.AVATAR_CHANGE} />
              <UnlockRow label="Okul Seçimi" unlocked={canSelectSchool} req={STREAK_REQUIREMENTS.SCHOOL_SELECTION} />
              <div className="pt-2 border-t border-gray-200 mt-2 flex justify-between text-sm">
                <span className="text-gray-500">Mevcut İstikrar</span>
                <span className="font-bold text-amber-600">{profile.istikrar} gün</span>
              </div>
            </div>

            {/* Account */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hesap</h3>
              <button
                onClick={() => logout({ showToast: true, redirectTo: "/login" })}
                disabled={isLoggingOut}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helper components ─── */

function SummaryCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "green" | "purple" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
  };
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] sm:text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold">{value.toLocaleString("tr-TR")}</p>
    </div>
  );
}

const SUBJECT_COLORS: Record<string, string> = {
  "Matematik": "bg-blue-500",
  "Türkçe": "bg-orange-500",
  "Fen Bilimleri": "bg-emerald-500",
  "Fizik": "bg-purple-500",
  "Kimya": "bg-amber-500",
  "Biyoloji": "bg-lime-500",
  "İngilizce": "bg-rose-500",
  "Tarih": "bg-yellow-500",
  "Coğrafya": "bg-teal-500",
};

function SubjectBar({ subject }: { subject: { subject: string; accuracy: number; completedChallenges: number; totalChallenges: number } }) {
  const barColor = SUBJECT_COLORS[subject.subject] || "bg-gray-500";
  const pct = subject.totalChallenges > 0
    ? Math.round((subject.completedChallenges / subject.totalChallenges) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">%{pct} tamamlandı</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            subject.accuracy >= 80 ? "bg-green-100 text-green-700" :
            subject.accuracy >= 50 ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          }`}>
            %{subject.accuracy}
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FieldGroup({ label, locked, days, lockLabel, children }: {
  label: string;
  locked: boolean;
  days: number;
  lockLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
      {locked && <LockedHint days={days} label={lockLabel} />}
    </div>
  );
}

function LockedHint({ days, label }: { days: number; label: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-amber-600">
      <Lock className="h-3 w-3" />
      {label} için {days} günlük istikrar gerekli
    </p>
  );
}

function UnlockRow({ label, unlocked, req }: { label: string; unlocked: boolean; req: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-600">{label}</span>
      {unlocked ? (
        <span className="text-green-600 font-medium">Açık</span>
      ) : (
        <span className="text-amber-600 font-medium">{req} gün gerekli</span>
      )}
    </div>
  );
}
