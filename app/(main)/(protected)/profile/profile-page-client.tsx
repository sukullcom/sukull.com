"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { SCHOOL_AND_GRADE_LOCK_MONTHS } from "@/lib/school-grade-lock";

// Lazy-load the KVKK / account-deletion dialog. It's only reachable from
// inside the Settings tab and pulls in a Radix dialog + confirm-input
// state machine — code-splitting keeps it out of the initial profile JS.
const DangerZone = dynamic(() => import("./danger-zone").then((m) => m.DangerZone), {
  ssr: false,
  loading: () => null,
});

// `ProfileSchoolSelector` is only rendered inside the Settings tab, which
// is not the default view. Deferring its ~10 kB of JS plus its downstream
// network fetch for the schools catalog keeps the initial Analytics tab
// render path lean — users who only glance at their stats never pay for it.
const ProfileSchoolSelector = dynamic(
  () => import("./profile-school-selector").then((m) => m.ProfileSchoolSelector),
  {
    ssr: false,
    loading: () => (
      <div className="h-11 w-full animate-pulse rounded-lg bg-muted" aria-hidden />
    ),
  },
);
import { Button } from "@/components/ui/button";
import { AvatarGenerator } from "random-avatar-generator";
import Image from "next/image";
import { School } from "@/types";
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
import { ProfileLearningPath } from "./profile-learning-path";
import Link from "next/link";

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
  learningPath?: string | null;
  studentGrade?: number | null;
  onboardingCompletedAt?: Date | string | null;
  learningPathLastSetAt?: Date | string | null;
  learningPathChangeCount?: number;
  schoolChangeLockedUntil?: Date | string | null;
  studentGradeChangeLockedUntil?: Date | string | null;
};

export default function ProfilePageClient({
  profile,
  allSchools,
  analytics,
  hasAnalyticsAccess,
}: {
  profile: ProfileProps;
  allSchools: School[];
  analytics: ProfileAnalyticsData | null;
  /** Aylık abonelik — detaylı profil analizi + sonsuz can */
  hasAnalyticsAccess: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"analytics" | "settings">("analytics");
  const [username, setUsername] = useState(profile.userName || "Anonymous");
  const [avatarUrl, setAvatarUrl] = useState(normalizeAvatarUrl(profile.userImageSrc));
  const [dailyTarget, setDailyTarget] = useState(profile.dailyTarget || 50);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(profile.schoolId ?? null);
  const [selectedSchoolName, setSelectedSchoolName] = useState<string | null>(null);
  const [schoolConfirmOpen, setSchoolConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
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

  const schoolLockUntil = useMemo(() => {
    return profile.schoolChangeLockedUntil
      ? new Date(profile.schoolChangeLockedUntil)
      : null;
  }, [profile.schoolChangeLockedUntil]);

  const schoolChangeBlockedByPolicy = useMemo(() => {
    return (
      !!schoolLockUntil &&
      schoolLockUntil.getTime() > Date.now() &&
      profile.schoolId != null
    );
  }, [schoolLockUntil, profile.schoolId]);

  /** İstikrar veya 6 ay okul politikası — seçici kilitli; toast ile uyarı yerine UI kilitli. */
  const schoolInteractionLocked =
    !canSelectSchool || schoolChangeBlockedByPolicy;

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

  /**
   * Asıl yazma çağrısı. Tüm validation `handleSave`'de yapılır; bu helper
   * sadece DB'ye yazar ve toast tetikler. Okul değişimi olduğunda araya
   * onay diyaloğu girer (`handleSave` → setSchoolConfirmOpen → confirm →
   * `runSave`); diğer alanlar değişiyorsa doğrudan `runSave` çağrılır.
   */
  const runSave = useCallback(
    (schoolToSave: number | null) => {
      startTransition(() => {
        updateProfileAction(username.trim(), avatarUrl, schoolToSave, dailyTarget)
          .then(() => toast.success("Profil güncellendi!"))
          .catch((err) => {
            toast.error(err.message || "Profil güncellenirken hata oluştu.");
          });
      });
    },
    [username, avatarUrl, dailyTarget],
  );

  const handleSave = useCallback(() => {
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
      toast.error("Kullanıcı adı boş olamaz.");
      return;
    }

    let schoolToSave = profile.schoolId;
    if (selectedSchoolId !== profile.schoolId) {
      if (!canSelectSchool) return;
      schoolToSave = selectedSchoolId;
    }
    if (!profile.schoolId && !selectedSchoolId && canSelectSchool) {
      toast.error("Lütfen bir okul seçin!");
      return;
    }
    if (
      selectedSchoolId !== profile.schoolId &&
      schoolChangeBlockedByPolicy
    ) {
      return;
    }

    // Okul değişimi (yeni veya farklı okul) için onay diyaloğu — geri alınması
    // 6 ay sürdüğü için kullanıcının "yanlışlıkla kaydetme" senaryosunu
    // engelleriz. İlk atama (profile.schoolId == null) için de uyarıyı
    // gösteriyoruz; "deneme süresi" muafiyeti server tarafında, ama kullanıcı
    // yine bilinçli onay versin.
    const schoolChanging =
      selectedSchoolId !== profile.schoolId && selectedSchoolId !== null;
    if (schoolChanging) {
      setSchoolConfirmOpen(true);
      return;
    }

    runSave(schoolToSave);
  }, [
    username,
    avatarUrl,
    selectedSchoolId,
    dailyTarget,
    canChangeUsername,
    canChangeAvatar,
    canChangeDailyGoal,
    canSelectSchool,
    profile,
    schoolChangeBlockedByPolicy,
    runSave,
  ]);

  const dailyTargetOptions = useMemo(
    () => [25, 50, 75, 100, 150, 200, 250, 300].map((v) => ({ value: v, label: `${v} puan` })),
    []
  );

  const s = analytics?.summary;

  return (
    <div className="flex flex-row-reverse gap-[48px] px-3 sm:px-6">
      <div className="flex-1 pb-10">
        {/* Profile Header */}
        <div className="flex flex-row items-center gap-4 sm:gap-6 mb-6">
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 shrink-0">
            <Image
              src={avatarUrl}
              alt="Avatar"
              fill
              sizes="96px"
              className="rounded-full border-4 border-card object-cover shadow-lg"
              priority
              unoptimized={isExternalAvatar}
              onError={() => setAvatarUrl(normalizeAvatarUrl(null))}
            />
          </div>
          <div className="text-left flex-1 min-w-0">
            <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
              {profile.userName}
            </h1>
            <div className="flex flex-wrap items-center justify-start gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-sm text-suk-warning">
                <Zap className="h-4 w-4" />
                <span className="font-semibold">{profile.istikrar} gün</span>
              </div>
              {s && (
                <>
                  <div className="flex items-center gap-1.5 text-sm text-suk-payment">
                    <Trophy className="h-4 w-4" />
                    <span className="font-semibold">{s.totalPoints.toLocaleString("tr-TR")} puan</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-suk-brand">
                    <Target className="h-4 w-4" />
                    <span className="font-semibold">%{s.overallAccuracy} doğruluk</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl border-2 border-border p-1">
          <button
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs transition-all sm:text-sm ${
              activeTab === "analytics"
                ? "bg-muted font-bold text-foreground"
                : "font-medium text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            <BarChart3 className="h-4 w-4" />
            Analiz
          </button>
          <button
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs transition-all sm:text-sm ${
              activeTab === "settings"
                ? "bg-muted font-bold text-foreground"
                : "font-medium text-muted-foreground hover:text-foreground"
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
            {!hasAnalyticsAccess && (
              <div className="rounded-2xl border-2 border-suk-play/30 bg-gradient-to-br from-suk-play-soft to-suk-payment-soft p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-suk-play/20 bg-card shadow-sm">
                    <Lock className="h-7 w-7 text-suk-play" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-foreground">Detaylı analiz Premium ile</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Konu ve kurs bazlı performans, zorluk dağılımı ve özet istatistikler aylık abonelikte.
                      Ayrıca <strong className="text-foreground">sonsuz can</strong> avantajı da dahil.
                    </p>
                  </div>
                  <Button variant="payment" size="lg" className="shrink-0 w-full sm:w-auto" asChild>
                    <Link prefetch={false} href="/shop">
                      Mağazaya git
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            {hasAnalyticsAccess && s && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryCard icon={<BookOpen className="h-5 w-5" />} label="Başlanan Kurs" value={s.totalCoursesStarted} color="blue" />
                <SummaryCard icon={<Trophy className="h-5 w-5" />} label="Tamamlanan" value={s.totalCoursesCompleted} color="green" />
                <SummaryCard icon={<Target className="h-5 w-5" />} label="Çözülen Soru" value={s.totalChallengesCompleted} color="purple" />
                <SummaryCard icon={<Zap className="h-5 w-5" />} label="Aktif Gün" value={s.daysActive} color="amber" />
              </div>
            )}

            {/* Subject Performance */}
            {hasAnalyticsAccess && analytics && analytics.subjectAnalytics.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
                  <TrendingUp className="h-4 w-4 text-suk-payment" />
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
            {hasAnalyticsAccess && analytics && analytics.courseAnalytics.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
                  <BookOpen className="h-4 w-4 text-suk-brand" />
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
                            <span className="truncate pr-2 text-xs font-medium text-muted-foreground sm:text-sm">
                              {c.courseTitle}
                            </span>
                            <span className="shrink-0 text-xs font-bold text-muted-foreground/90">
                              %{pct}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct === 100 ? "bg-suk-brand-hover" : "bg-suk-brand"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[10px] text-muted-foreground/80">
                              {c.completedChallenges}/{c.totalChallenges} soru
                            </span>
                            <span className="text-[10px] text-muted-foreground/80">
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
            {hasAnalyticsAccess &&
              analytics &&
              (analytics.difficultyAnalytics.length > 0 || analytics.typeAnalytics.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analytics.difficultyAnalytics.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="mb-3 text-sm font-bold text-foreground">Zorluk Dağılımı</h3>
                    <div className="space-y-2">
                      {analytics.difficultyAnalytics.map((d) => (
                        <div key={d.difficulty} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{d.difficulty}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground/80">{d.total} soru</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              d.accuracy >= 80 ? "bg-suk-brand-soft text-suk-brand-soft-fg" :
                              d.accuracy >= 50 ? "bg-suk-warning-soft text-suk-warning-soft-fg" :
                              "bg-suk-danger-soft text-suk-danger"
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
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="mb-3 text-sm font-bold text-foreground">Soru Türü Dağılımı</h3>
                    <div className="space-y-2">
                      {analytics.typeAnalytics.map((t) => (
                        <div key={t.type} className="flex items-center justify-between text-sm">
                          <span className="text-xs text-muted-foreground">{t.type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground/80">{t.total}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              t.accuracy >= 80 ? "bg-suk-brand-soft text-suk-brand-soft-fg" :
                              t.accuracy >= 50 ? "bg-suk-warning-soft text-suk-warning-soft-fg" :
                              "bg-suk-danger-soft text-suk-danger"
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
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground">
                <Zap className="h-4 w-4 text-suk-warning" />
                İstikrar Takvimi
              </h3>
              <StreakCalendarAdvanced startDate={profile.startDate} />
            </div>

            {/* Empty state (aboneler, veri yoksa) */}
            {hasAnalyticsAccess && (!analytics || analytics.courseAnalytics.length === 0) && (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <BarChart3 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">Henüz analiz verisi yok</p>
                <p className="mt-1 text-xs text-muted-foreground/80">Derslerden soru çözdükçe burada istatistiklerini göreceksin.</p>
              </div>
            )}
          </div>
        )}
        

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="mx-auto max-w-xl space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">

            {/* Avatar */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-border shadow-md sm:h-36 sm:w-36">
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  sizes="144px"
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
                <LockedHint days={STREAK_REQUIREMENTS.AVATAR_CHANGE} label="Avatar değiştirmek" streak={profile.istikrar} />
              )}
            </div>

            {/* Username */}
            <FieldGroup label="Kullanıcı Adı" locked={!canChangeUsername} days={STREAK_REQUIREMENTS.USERNAME_CHANGE} lockLabel="Kullanıcı adı değiştirmek" streak={profile.istikrar}>
              <input
                className={`w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-1 ${
                  !canChangeUsername
                    ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                    : "border-input focus:border-suk-payment focus:ring-suk-payment/25"
                }`}
                value={username}
                onChange={(e) => canChangeUsername && setUsername(e.target.value)}
                maxLength={30}
                disabled={!canChangeUsername}
              />
            </FieldGroup>

            {/* Daily Target */}
            <FieldGroup label="Günlük Hedef" locked={!canChangeDailyGoal} days={STREAK_REQUIREMENTS.DAILY_GOAL_CHANGE} lockLabel="Günlük hedef değiştirmek" streak={profile.istikrar}>
              <select
                className={`w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-1 ${
                  !canChangeDailyGoal
                    ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                    : "border-input focus:border-suk-payment focus:ring-suk-payment/25"
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

            {profile.onboardingCompletedAt && (
              <ProfileLearningPath
                initialPath={profile.learningPath ?? null}
                initialGrade={profile.studentGrade ?? null}
                learningPathLastSetAt={profile.learningPathLastSetAt ?? null}
                learningPathChangeCount={profile.learningPathChangeCount ?? 0}
                onboardingCompletedAt={profile.onboardingCompletedAt}
                studentGradeChangeLockedUntil={profile.studentGradeChangeLockedUntil ?? null}
              />
            )}

            {/* Okul: istikrar veya 6 ay kilidi — sınıf kilidiyle aynı görsel (kilit + tarih). */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Okul
              </label>
              <ProfileSchoolSelector
                schools={allSchools}
                initialSchoolId={selectedSchoolId}
                onSelect={(id, details) => {
                  setSelectedSchoolId(id);
                  setSelectedSchoolName(details?.name ?? null);
                }}
                disabled={schoolInteractionLocked}
              />
              {!canSelectSchool && (
                <LockedHint
                  days={STREAK_REQUIREMENTS.SCHOOL_SELECTION}
                  label="Okul seçmek"
                  streak={profile.istikrar}
                />
              )}
              {canSelectSchool && schoolChangeBlockedByPolicy && schoolLockUntil && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-suk-danger">
                  <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Okul değişikliği için{" "}
                  <strong>{schoolLockUntil.toLocaleDateString("tr-TR")}</strong> tarihine kadar
                  beklemelisin (6 ay kuralı).
                </p>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSave}
              disabled={pending || !username.trim()}
            >
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>

            {/* Account */}
            <div className="border-t border-border pt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hesap</h3>
              <button
                onClick={() => logout({ showToast: true, redirectTo: "/login" })}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 rounded-xl border border-suk-danger/25 bg-suk-danger-soft px-4 py-3 text-sm font-medium text-suk-danger transition-colors hover:bg-suk-danger-soft/80 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
              </button>
            </div>

            {/* KVKK / GDPR: permanent account deletion. Separated from the
                regular logout button to emphasise irreversibility. */}
            <DangerZone username={username} />
          </div>
        )}
      </div>

      {/* Okul değişimi onay diyaloğu — 6 ay kuralı + seçilen okul net özet. */}
      <ConfirmActionDialog
        open={schoolConfirmOpen}
        onOpenChange={setSchoolConfirmOpen}
        title={profile.schoolId == null ? "Okul seç" : "Okulu değiştir"}
        description={
          <>
            <span className="block mb-2">
              {profile.schoolId == null ? "Şu okula geçilecek:" : "Yeni okul:"}{" "}
              <strong className="text-foreground">
                {selectedSchoolName ?? "(seçilen okul)"}
              </strong>
            </span>
            <span className="block text-xs text-suk-warning-soft-fg">
              Lider tablosunun adil kalması için okul değişimi genelde her{" "}
              {SCHOOL_AND_GRADE_LOCK_MONTHS} ayda bir yapılabilir. Yeni hesaplar
              için ilk hafta deneme süresi vardır; emin değilsen sonra değiştirebilirsin.
            </span>
          </>
        }
        confirmLabel={profile.schoolId == null ? "Okulu kaydet" : "Evet, değiştir"}
        cancelLabel="Vazgeç"
        confirmVariant="primary"
        pending={pending}
        onConfirm={() => {
          setSchoolConfirmOpen(false);
          runSave(selectedSchoolId);
        }}
      />
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
    blue: "border-suk-payment-ring/40 bg-suk-payment-soft text-suk-payment",
    green: "border-suk-brand/30 bg-suk-brand-soft text-suk-brand-border",
    purple: "border-suk-play-line bg-suk-play-soft text-suk-play-soft-fg",
    amber: "border-suk-warning-border bg-suk-warning-soft text-suk-warning-soft-fg",
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
  "Matematik": "bg-suk-payment",
  "Türkçe": "bg-suk-warning",
  "Fen Bilimleri": "bg-suk-brand",
  "Fizik": "bg-suk-play",
  "Kimya": "bg-suk-brand-hover",
  "Biyoloji": "bg-suk-info",
  "İngilizce": "bg-suk-danger",
  "Tarih": "bg-suk-brand-border",
  "Coğrafya": "bg-suk-payment-hover",
};

function SubjectBar({ subject }: { subject: { subject: string; accuracy: number; completedChallenges: number; totalChallenges: number } }) {
  const barColor = SUBJECT_COLORS[subject.subject] || "bg-muted-foreground";
  const pct = subject.totalChallenges > 0
    ? Math.round((subject.completedChallenges / subject.totalChallenges) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-muted-foreground">{subject.subject}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/80">%{pct} tamamlandı</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            subject.accuracy >= 80 ? "bg-suk-brand-soft text-suk-brand-soft-fg" :
            subject.accuracy >= 50 ? "bg-suk-warning-soft text-suk-warning-soft-fg" :
            "bg-suk-danger-soft text-suk-danger"
          }`}>
            %{subject.accuracy}
          </span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FieldGroup({ label, locked, days, lockLabel, streak = 0, children }: {
  label: string;
  locked: boolean;
  days: number;
  lockLabel: string;
  streak?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
      {locked && <LockedHint days={days} label={lockLabel} streak={streak} />}
    </div>
  );
}

function LockedHint({ days, label, streak = 0 }: { days: number; label: string; streak?: number }) {
  if (days <= 0) {
    return null;
  }
  const pct = Math.min(Math.round((streak / days) * 100), 100);
  return (
    <div className="space-y-1 mt-1">
      <p className="flex items-center justify-between text-xs text-suk-warning">
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3" />
          {label} için {days} günlük istikrar gerekli
        </span>
        <span className="font-semibold">{streak}/{days}</span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-suk-warning-soft">
        <div className="h-full rounded-full bg-suk-warning transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

