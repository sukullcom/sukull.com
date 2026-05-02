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
        return <Target className="w-4 h-4 text-suk-payment" />;
      case "Çalışma Arkadaşı":
        return <Users className="w-4 h-4 text-suk-brand" />;
      case "Kod Paylaşımı":
        return <Code className="w-4 h-4 text-suk-play" />;
      default:
        return <Shield className="w-4 h-4 text-muted-foreground" />;
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
    <Card className={`bg-gradient-to-br from-suk-warning-soft to-suk-danger-soft border-suk-warning-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-suk-warning" />
          <CardTitle className="text-suk-warning-soft-fg text-sm font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-suk-warning-soft rounded-lg border border-suk-warning-border">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-suk-warning" />
            <div>
              <p className="font-semibold text-suk-warning-soft-fg text-sm">Mevcut İstikrarın</p>
              <p className="text-xs text-muted-foreground">Günlük hedefini tamamladığın gün sayısı</p>
            </div>
          </div>
          <Badge variant="outline" className="border-suk-warning-border bg-suk-warning-soft text-suk-warning-soft-fg font-bold">
            {currentStreak} gün
          </Badge>
        </div>

        <Separator className="bg-suk-warning-border" />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-suk-warning-soft-fg mb-2">İstikrar Gereksinimleri</h4>
          
          {rules.map((rule, index) => {
            const status = getRequirementStatus(rule.requirement);
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-start gap-2">
                  {getIcon(rule.feature)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-foreground">{rule.feature}</p>
                      <Badge 
                        variant={status.badgeVariant}
                        className={`text-xs ${
                          status.isAchieved 
                            ? "bg-suk-brand-soft text-suk-brand-soft-fg border-suk-brand/30" 
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {rule.requirement} gün
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{rule.description}</p>
                    <div className="text-xs">
                      <span className={`${
                        status.isAchieved ? "text-suk-brand" : "text-muted-foreground"
                      }`}>
                        <span className="flex items-center gap-1">{status.badgeIcon} {status.badgeText}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {index < rules.length - 1 && <Separator className="bg-suk-warning-border/60" />}
              </div>
            );
          })}
        </div>

        <Separator className="bg-suk-warning-border" />

        <div className="bg-suk-warning-soft p-3 rounded-lg border border-suk-warning-border">
          <h5 className="text-xs font-semibold text-suk-warning-soft-fg mb-2 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> İpucu</h5>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Her gün belirlediğin puan hedefine ulaşarak istikrarını artır. 
            İstikrarın sıfırlanmasını önlemek için günlük hedefini kaçırma!
          </p>
        </div>

        {currentStreak > 0 && (
          <div className="bg-suk-warning-soft p-3 rounded-lg border border-suk-warning-border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-suk-warning" />
              <h5 className="text-xs font-semibold text-suk-warning-soft-fg">İlerleme Durumu</h5>
            </div>
            <div className="space-y-1">
              {rules.map((rule, index) => {
                const progress = Math.min(currentStreak, rule.requirement);
                const percentage = (progress / rule.requirement) * 100;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground">{rule.feature}</span>
                      <span className="text-muted-foreground">{progress}/{rule.requirement}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          percentage === 100 ? "bg-suk-brand" : "bg-suk-warning"
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
