import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { User, Target, Users, ImageIcon, School, CheckCircle, Lock, Info, BookOpen, RefreshCw, Heart, Flame, Shield, Trophy } from 'lucide-react';
import { getAllStreakRules } from "@/utils/streak-requirements";

type QuestsProps = {
  currentStreak: number;
  achievements: {
    profileEditingUnlocked?: boolean;
    studyBuddyUnlocked?: boolean;
    codeShareUnlocked?: boolean;
  };
};

export const Quests = ({ currentStreak }: QuestsProps) => {
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

  return (
    <div className="w-full space-y-6">
      <h2 className="text-center font-bold text-neutral-800 text-xl">
        Özellik Kilitleri
      </h2>

      <div className="space-y-3">
        {rules.map((rule, index) => {
          const status = getFeatureStatus(rule.requirement);

          return (
            <div
              key={index}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                status.isUnlocked
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`shrink-0 p-2.5 rounded-full ${
                  status.isUnlocked ? "bg-green-100" : "bg-gray-100"
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

      {/* Tips */}
      <Card className="border-blue-100 bg-blue-50/50">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-blue-700 text-sm font-semibold">
              Sistem İpuçları
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid gap-2 text-xs text-blue-700">
            <div className="flex items-start gap-2 p-2.5 bg-white/60 rounded-lg">
              <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold">Ders Puanları:</span> Doğru +10, yanlış −1 puan ve −1 can. Tamamlama +5, hatasız +15 bonus.
              </p>
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-white/60 rounded-lg">
              <RefreshCw className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold">Pratik:</span> Tamamladığın dersleri tekrarla, doğru başına +5 puan. Can kaybetmezsin.
              </p>
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-white/60 rounded-lg">
              <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold">Can:</span> 100 puanla doldur veya her 4 saatte 1 adet otomatik yenilenir.
              </p>
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-white/60 rounded-lg">
              <Flame className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold">İstikrar Bonusu:</span> 3 gün +10, 7 gün +30, 15 gün +75, 30 gün +150, 60 gün +300 puan.
              </p>
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-white/60 rounded-lg">
              <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold">İstikrar Koruma:</span> Mağazadan al, 1 gün hedef kaçırsan bile istikrarın bozulmasın.
              </p>
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-white/60 rounded-lg">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold">Kalıcı Kilit Açma:</span> Bir kez açılan özellik, istikrarın düşse de açık kalır.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
