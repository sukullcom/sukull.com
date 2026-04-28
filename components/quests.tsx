import { Progress } from "./ui/progress";
import {
  User,
  Target,
  Users,
  ImageIcon,
  School,
  CheckCircle,
  Lock,
  Info,
  BookOpen,
  RefreshCw,
  Heart,
  Flame,
  Shield,
  Trophy,
  Award,
} from "lucide-react";
import { getAllStreakRules } from "@/utils/streak-requirements";
import type { UserBadgeSummary } from "@/actions/user-badges";

type QuestsProps = {
  currentStreak: number;
  achievements: {
    profileEditingUnlocked?: boolean;
    studyBuddyUnlocked?: boolean;
    codeShareUnlocked?: boolean;
  };
  /** Yoksa (sidebar özetinde) rozet bölümü gösterilmez. */
  badgeSummary?: UserBadgeSummary | null;
  /**
   * true: Hedefler sayfası — lg ve üzeri sağ sütunda zaten aynı içerik var;
   *        kilitler + ipuçları yalnızca küçük ekranda (lg altı) gösterilir.
   */
  hideLocksAndTipsOnLargeScreens?: boolean;
};

const CATEGORY_LABEL: Record<string, string> = {
  istikrar: "İstikrar",
  performans: "Performans",
  liderlik: "Liderlik",
};

export const Quests = ({
  currentStreak,
  badgeSummary = null,
  hideLocksAndTipsOnLargeScreens = false,
}: QuestsProps) => {
  const rules = getAllStreakRules();

  const getIcon = (feature: string) => {
    switch (feature) {
      case "Kullanıcı Adı Değiştirme":
        return <User className="w-5 h-5 text-blue-500" />;
      case "Günlük Hedef Belirleme":
        return <Target className="w-5 h-5 text-orange-500" />;
      case "Çalışma Arkadaşı":
        return <Users className="w-5 h-5 text-green-500" />;
      case "Avatar Değiştirme":
        return <ImageIcon className="w-5 h-5 text-purple-500" />;
      case "Okul Seçimi":
        return <School className="w-5 h-5 text-indigo-500" />;
      default:
        return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getFeatureStatus = (requirement: number) => {
    const isUnlocked = currentStreak >= requirement;
    const progress = Math.min(currentStreak, requirement);
    const percentage = (progress / requirement) * 100;

    return {
      isUnlocked,
      progress,
      percentage,
      remainingDays: Math.max(0, requirement - currentStreak),
    };
  };

  const locksShell = hideLocksAndTipsOnLargeScreens ? "space-y-6 lg:hidden" : "space-y-6";

  return (
    <div className="w-full space-y-6">
      <div className={locksShell}>
        <h2 className="text-left font-bold text-gray-700 text-base">
          Özellik Kilitleri
        </h2>

        <div className="space-y-3">
          {rules.map((rule, index) => {
          const status = getFeatureStatus(rule.requirement);

          return (
            <div
              key={index}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors ${
                status.isUnlocked
                  ? "border-green-400"
                  : "border-gray-200"
              }`}
            >
              <div
                className={`shrink-0 p-2.5 rounded-full ${
                  status.isUnlocked ? "bg-green-50" : "bg-gray-50"
                }`}
              >
                {getIcon(rule.feature)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm text-gray-800 truncate">
                    {rule.feature}
                  </h3>
                  {status.isUnlocked ? (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Açık
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-gray-500">
                      {status.progress}/{rule.requirement} gün
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">{rule.description}</p>
                {!status.isUnlocked && (
                  <Progress value={status.percentage} className="h-1.5" />
                )}
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {badgeSummary && badgeSummary.badges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-left font-bold text-gray-700 text-base flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" />
            Rozetler
          </h2>
          <p className="text-xs text-gray-500 -mt-1">
            İstikrar, soru çözümü, seri doğrular ve sıralamalara göre kazanılır.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badgeSummary.badges.map((b) => {
              const pct =
                b.target != null && b.target > 0 && b.progress != null
                  ? Math.min(100, Math.round((b.progress / b.target) * 100))
                  : b.unlocked
                    ? 100
                    : 0;
              return (
                <div
                  key={b.id}
                  className={`flex gap-3 rounded-2xl border-2 p-3 transition-colors ${
                    b.unlocked
                      ? "border-amber-400 bg-amber-50/60"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div
                    className={`shrink-0 p-2 rounded-full ${
                      b.unlocked ? "bg-amber-100" : "bg-gray-100"
                    }`}
                  >
                    <Award
                      className={`h-5 w-5 ${b.unlocked ? "text-amber-700" : "text-gray-400"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          {CATEGORY_LABEL[b.category] ?? b.category}
                        </p>
                        <h3 className="font-semibold text-sm text-gray-900">{b.title}</h3>
                      </div>
                      {b.unlocked ? (
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{b.description}</p>
                    {!b.unlocked && b.target != null && b.progress != null && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>İlerleme</span>
                          <span>
                            {b.progress}/{b.target}
                          </span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        className={
          hideLocksAndTipsOnLargeScreens
            ? "border-2 border-gray-200 rounded-2xl p-4 lg:hidden"
            : "border-2 border-gray-200 rounded-2xl p-4"
        }
      >
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-gray-500" />
          <h3 className="text-gray-700 text-sm font-bold">
            Sistem İpuçları
          </h3>
        </div>
        <div className="grid gap-2 text-xs text-gray-600">
          <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
            <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold">Ders Puanları:</span> Doğru +10, yanlış −1 puan ve −1 can. Tamamlama +5, hatasız +15 bonus.
            </p>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
            <RefreshCw className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold">Pratik:</span> Tamamladığın dersleri tekrarla, doğru başına +5 puan. Can kaybetmezsin.
            </p>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
            <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold">Can:</span> 100 puanla doldur, sonsuz
              can aboneliği al veya yaklaşık 24 saatte bir ücretsiz tam
              dolum bekle.
            </p>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
            <Flame className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold">İstikrar Bonusu:</span> 3 gün +10, 7 gün +30, 15 gün +75, 30 gün +150, 60 gün +300 puan.
            </p>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
            <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold">İstikrar Koruma:</span> Mağazadan al, 1 gün hedef kaçırsan bile istikrarın bozulmasın.
            </p>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold">Kalıcı Kilit Açma:</span> Bir kez açılan özellik, istikrarın düşse de açık kalır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
