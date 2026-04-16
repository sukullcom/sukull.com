"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Target, Users, Code, Shield, Info, Flame, Lightbulb, CheckCircle, Lock } from "lucide-react";
import { getAllStreakRules } from "@/utils/streak-requirements";

interface StreakRulesProps {
  currentStreak: number;
  title?: string;
  className?: string;
}

export function StreakRules({ 
  currentStreak, 
  title = "Platform Kuralları",
  className = "" 
}: StreakRulesProps) {
  const rules = getAllStreakRules();

  const getIcon = (feature: string) => {
    switch (feature) {
      case "Profil Düzenleme":
        return <Target className="w-4 h-4 text-blue-500" />;
      case "Çalışma Arkadaşı":
        return <Users className="w-4 h-4 text-green-500" />;
      case "Kod Paylaşımı":
        return <Code className="w-4 h-4 text-purple-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRequirementStatus = (requiredDays: number) => {
    const isAchieved = currentStreak >= requiredDays;
    return {
      isAchieved,
      badgeVariant: (isAchieved ? "default" : "secondary") as "default" | "secondary",
      badgeText: isAchieved ? "Ulaşıldı" : `${requiredDays - currentStreak} gün kaldı`,
      badgeIcon: isAchieved ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />
    };
  };

  return (
    <Card className={`bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-800 text-sm font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak Display */}
        <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <div>
              <p className="font-semibold text-orange-800 text-sm">Mevcut İstikrarın</p>
              <p className="text-xs text-orange-600">Günlük hedefini tamamladığın gün sayısı</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-orange-200 text-orange-800 font-bold">
            {currentStreak} gün
          </Badge>
        </div>

        <Separator className="bg-orange-200" />

        {/* Streak Requirements */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-orange-700 mb-2">İstikrar Gereksinimleri</h4>
          
          {rules.map((rule, index) => {
            const status = getRequirementStatus(rule.requirement);
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-start gap-2">
                  {getIcon(rule.feature)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-orange-800">{rule.feature}</p>
                      <Badge 
                        variant={status.badgeVariant}
                        className={`text-xs ${
                          status.isAchieved 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {rule.requirement} gün
                      </Badge>
                    </div>
                    <p className="text-xs text-orange-600 mb-1">{rule.description}</p>
                    <div className="text-xs">
                      <span className={`${
                        status.isAchieved ? "text-green-600" : "text-gray-600"
                      }`}>
                        <span className="flex items-center gap-1">{status.badgeIcon} {status.badgeText}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {index < rules.length - 1 && <Separator className="bg-orange-100" />}
              </div>
            );
          })}
        </div>

        <Separator className="bg-orange-200" />

        {/* Tips */}
        <div className="bg-orange-100 p-3 rounded-lg">
          <h5 className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> İpucu</h5>
          <p className="text-xs text-orange-600 leading-relaxed">
            Her gün belirlediğin puan hedefine ulaşarak istikrarını artır. 
            İstikrarın sıfırlanmasını önlemek için günlük hedefini kaçırma!
          </p>
        </div>

        {/* Progress Motivation */}
        {currentStreak > 0 && (
          <div className="bg-orange-100 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-600" />
              <h5 className="text-xs font-semibold text-orange-700">İlerleme Durumu</h5>
            </div>
            <div className="space-y-1">
              {rules.map((rule, index) => {
                const progress = Math.min(currentStreak, rule.requirement);
                const percentage = (progress / rule.requirement) * 100;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-orange-700">{rule.feature}</span>
                      <span className="text-orange-600">{progress}/{rule.requirement}</span>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          percentage === 100 ? "bg-green-500" : "bg-orange-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 