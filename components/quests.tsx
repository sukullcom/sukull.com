import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Target, Users, Code, Shield, Info, CheckCircle, Lock } from "lucide-react";
import { getAllStreakRules } from "@/utils/streak-requirements";

type Props = {
  currentStreak?: number;
  points?: number;
};

export const Quests = ({ currentStreak = 0, points }: Props) => {
  const rules = getAllStreakRules();

  const getIcon = (feature: string) => {
    switch (feature) {
      case "Profil Düzenleme":
        return <Target className="w-6 h-6 text-blue-500" />;
      case "Çalışma Arkadaşı":
        return <Users className="w-6 h-6 text-green-500" />;
      case "Kod Paylaşımı":
        return <Code className="w-6 h-6 text-purple-500" />;
      default:
        return <Shield className="w-6 h-6 text-gray-500" />;
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
      remainingDays: Math.max(0, requirement - currentStreak)
    };
  };

  return (
    <div className="w-full p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
      <h1 className="text-center font-bold text-neutral-800 text-2xl mb-8">
        Özellik Kilitleri
      </h1>

      {/* Feature Unlock Cards */}
      <div className="grid gap-6 mb-8">
        {rules.map((rule, index) => {
          const status = getFeatureStatus(rule.requirement);
          
          return (
            <Card 
              key={index}
              className={`relative overflow-hidden transition-all duration-300 ${
                status.isUnlocked 
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-md" 
                  : "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      status.isUnlocked ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      {getIcon(rule.feature)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{rule.feature}</h3>
                      <p className="text-sm text-gray-600">{rule.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {status.isUnlocked ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">Açıldı</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                        <Lock className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-600">Kilitli</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      İstikrar Gereksinimi
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {status.progress}/{rule.requirement} gün
                    </span>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={status.percentage} 
                      className={`h-2 ${
                        status.isUnlocked ? "bg-green-100" : "bg-gray-200"
                      }`}
                    />
                    {status.isUnlocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                    )}
                  </div>
                  
                  {!status.isUnlocked && status.remainingDays > 0 && (
                    <p className="text-xs text-gray-500">
                      {status.remainingDays} gün daha gerekiyor
                    </p>
                  )}
                </div>
              </CardContent>
              
              {/* Unlock indicator */}
              {status.isUnlocked && (
                <div className="absolute top-4 right-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Tips Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800 text-lg font-semibold">Sistem İpuçları</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 text-blue-700">
            <div className="flex items-start gap-3 p-3 bg-blue-100 rounded-lg">
              <span className="text-lg">🔁</span>
              <div>
                <p className="font-semibold text-sm">Can Dolumu</p>
                <p className="text-xs">50 puan harcayarak canlarını doldurabilirsin.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-100 rounded-lg">
              <span className="text-lg">🎮</span>
              <div>
                <p className="font-semibold text-sm">Puan Kazan</p>
                <p className="text-xs">Puanın kalmadığında laboratuvar veya oyunlar bölümünden yeni puanlar kazanabilirsin.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-100 rounded-lg">
              <span className="text-lg">📚</span>
              <div>
                <p className="font-semibold text-sm">Çalışma Masası</p>
                <p className="text-xs">Her doğru soru +10 puan, her yanlış soru -10 puan ve -1 can demektir.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-100 rounded-lg">
              <span className="text-lg">🔄</span>
              <div>
                <p className="font-semibold text-sm">Pratik Modu</p>
                <p className="text-xs">Çalışma masasında tamamladığın dersleri tekrar ederek her doğru cevap için +2 puan ve +1 can kazanabilirsin.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-100 rounded-lg">
              <span className="text-lg">❤️</span>
              <div>
                <p className="font-semibold text-sm">Can Sıfırlanırsa</p>
                <p className="text-xs">Canın kalmadığında yeni soru cevaplayamazsın. Ancak, oyunlar ve laboratuvarlardan can kazanabilirsin.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-100 rounded-lg">
              <span className="text-lg">🏆</span>
              <div>
                <p className="font-semibold text-sm">Kalıcı Kilit Açma</p>
                <p className="text-xs">Bir özelliği bir kez açtığında, istikrarın düşse bile bu özellik açık kalır!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
