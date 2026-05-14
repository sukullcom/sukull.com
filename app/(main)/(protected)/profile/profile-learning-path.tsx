"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateLearningPathFromSettings } from "@/actions/learning-path";
import { Button } from "@/components/ui/button";
import {
  canChangeLearningPath,
  LEARNING_PATH_DAYS_BETWEEN_CHANGES,
  LEARNING_PATH_TRIAL_DAYS,
  LEARNING_PATH_LOW_POINTS_THRESHOLD,
} from "@/lib/learning-path";
import { BookOpen, GraduationCap, Lock, Sparkles, Users } from "lucide-react";

type Mode = "lgs" | "tyt_ayt" | "adult" | "full" | "";

type Props = {
  initialPath: string | null;
  initialGrade: number | null;
  learningPathLastSetAt: Date | string | null;
  learningPathChangeCount: number;
  onboardingCompletedAt: Date | string | null;
  /** Sınıf değişimi 6 ay kilidi — dolunca serbest. */
  studentGradeChangeLockedUntil?: Date | string | null;
  /** Muafiyet hesabı için kullanılır (`<500` puan → cooldown atlanır). */
  totalPoints?: number;
};

const pathLabel: Record<string, string> = {
  lgs: "5–8 (LGS)",
  tyt_ayt: "9–12 (TYT & AYT)",
  adult: "KPSS, YDS, ALES, YDT",
  full: "Tüm ders kataloğu (eski)",
};

function parseD(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  return new Date(v);
}

export function ProfileLearningPath({
  initialPath,
  initialGrade,
  learningPathLastSetAt,
  learningPathChangeCount,
  onboardingCompletedAt,
  studentGradeChangeLockedUntil,
  totalPoints,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(
    (initialPath === "lgs" || initialPath === "tyt_ayt" || initialPath === "adult"
      ? initialPath
      : "") as Mode
  );
  const [grade, setGrade] = useState<number | "">(initialGrade ?? "");
  const [pending, setPending] = useState(false);

  const policy = useMemo(() => {
    return canChangeLearningPath(
      new Date(),
      parseD(onboardingCompletedAt),
      parseD(learningPathLastSetAt),
      learningPathChangeCount ?? 0,
      {
        onboardingCompletedAt: parseD(onboardingCompletedAt),
        totalPoints: totalPoints ?? 0,
      },
    );
  }, [onboardingCompletedAt, learningPathLastSetAt, learningPathChangeCount, totalPoints]);

  const canEdit = policy.allowed;
  const exemption = policy.exemption;

  // Trial penceresi kaç gün kaldı? UI'da "2 gün kaldı" gibi belirgin
  // hatırlatma → kullanıcı serbest pencereyi gözden kaçırmasın.
  const trialDaysLeft = useMemo(() => {
    const onb = parseD(onboardingCompletedAt);
    if (!onb) return null;
    const trialEnd = new Date(onb.getTime());
    trialEnd.setDate(trialEnd.getDate() + LEARNING_PATH_TRIAL_DAYS);
    const ms = trialEnd.getTime() - Date.now();
    if (ms <= 0) return null;
    return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }, [onboardingCompletedAt]);

  const gradeLockUntil = parseD(studentGradeChangeLockedUntil);
  const gradePeriodLocked =
    gradeLockUntil != null && gradeLockUntil.getTime() > Date.now();

  const apply = () => {
    if (!canEdit) return;
    if (mode === "") {
      toast.error("Ortaokul, lise veya mezun sınav yolundan birini seçin.");
      return;
    }
    if (mode === "lgs" && (grade === "" || grade < 5 || grade > 8)) {
      toast.error("5–8. sınıf seçin.");
      return;
    }
    if (mode === "tyt_ayt" && (grade === "" || grade < 9 || grade > 12)) {
      toast.error("9–12. sınıf seçin.");
      return;
    }
    const g = mode === "adult" ? null : (grade as number);
    setPending(true);
    void updateLearningPathFromSettings(mode, g).then((r) => {
      setPending(false);
      if (r.ok) {
        toast.success("Yolun güncellendi. Ders listesine yansıdı.");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Öğrenme yolu</h3>
        <p className="text-sm text-muted-foreground">
          Şu an: <strong className="text-foreground">{pathLabel[initialPath ?? "full"] ?? "—"}</strong>
          {initialPath !== "adult" && initialGrade != null && (
            <span className="ml-1">· {initialGrade}. sınıf</span>
          )}
        </p>
        <p className="mt-2 text-xs text-suk-warning-soft-fg">
          {initialPath === "full"
            ? "Kataloğu sadeleştirmek için aşağıdan bir yol seçebilirsin."
            : `Yol değişimleri en az ${LEARNING_PATH_DAYS_BETWEEN_CHANGES} gün arayla yapılabilir. Sınıf değişimi ise en fazla altı ayda bir yapılabilir (ilk seçimden sonra kilit).`}
        </p>

        {/* Muafiyet aktif — kullanıcı kilit cooldown'una takılmıyor.
            Trial penceresi geri sayım, low_points ise eşik bilgisi. */}
        {canEdit && exemption === "trial" && trialDaysLeft != null && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-suk-brand/30 bg-suk-brand-soft/60 px-2 py-1.5 text-xs text-suk-brand-border">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>Deneme süresi aktif</strong> — {trialDaysLeft} gün kaldı.
              Bu süre boyunca yol/sınıf değişimleri serbest, cooldown başlamaz.
            </span>
          </p>
        )}
        {canEdit && exemption === "low_points" && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-suk-brand/30 bg-suk-brand-soft/60 px-2 py-1.5 text-xs text-suk-brand-border">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>
              Puanın {LEARNING_PATH_LOW_POINTS_THRESHOLD} altında olduğu sürece serbestçe
              değiştirebilirsin. Eşik geçilince standart {LEARNING_PATH_DAYS_BETWEEN_CHANGES} gün kuralı uygulanır.
            </span>
          </p>
        )}

        {gradePeriodLocked && gradeLockUntil && exemption == null && (
          <p className="mt-1 flex items-center gap-1 text-xs text-suk-danger">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Sınıf değişikliği için {gradeLockUntil.toLocaleDateString("tr-TR")} tarihine kadar beklemelisin.
          </p>
        )}
        {!canEdit && policy.reason === "cooldown" && policy.nextAllowedAt && (
          <p className="mt-1 flex items-center gap-1 text-xs text-suk-danger">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Sonraki değişim: {policy.nextAllowedAt.toLocaleString("tr-TR")}
          </p>
        )}
      </div>

      <div className={`space-y-3 ${!canEdit ? "opacity-50 pointer-events-none" : ""}`} aria-disabled={!canEdit}>
        {[
          { id: "lgs" as const, title: "Ortaokul (5–8) LGS", icon: <BookOpen className="h-4 w-4" /> },
          { id: "tyt_ayt" as const, title: "Lise (9–12) TYT & AYT", icon: <Users className="h-4 w-4" /> },
          { id: "adult" as const, title: "Üniversite & mezun sınavları", icon: <GraduationCap className="h-4 w-4" /> },
        ].map((opt) => (
          <button
            type="button"
            key={opt.id}
            onClick={() => {
              setMode(opt.id);
              if (opt.id === "lgs" && (grade === "" || grade < 5 || grade > 8)) setGrade("");
              if (opt.id === "tyt_ayt" && (grade === "" || grade < 9 || grade > 12)) setGrade("");
            }}
            className={[
              "w-full flex items-center gap-2 rounded-xl border-2 p-2.5 text-left text-sm font-medium transition",
              mode === opt.id ? "border-suk-brand bg-suk-brand-soft/50" : "border-border",
            ].join(" ")}
          >
            {opt.icon}
            {opt.title}
          </button>
        ))}

        {mode === "lgs" && (
          <select
            className="w-full rounded-lg border border-input p-2 text-sm"
            value={grade}
            onChange={(e) => setGrade(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
          >
            <option value="">Sınıf seç</option>
            {[5, 6, 7, 8].map((g) => (
              <option key={g} value={g}>
                {g}. sınıf
              </option>
            ))}
          </select>
        )}
        {mode === "tyt_ayt" && (
          <select
            className="w-full rounded-lg border border-input p-2 text-sm"
            value={grade}
            onChange={(e) => setGrade(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
          >
            <option value="">Sınıf seç</option>
            {[9, 10, 11, 12].map((g) => (
              <option key={g} value={g}>
                {g}. sınıf
              </option>
            ))}
          </select>
        )}
      </div>

      <Button variant="primary" className="w-full" onClick={apply} disabled={pending || !canEdit || !mode}>
        {pending ? "Kaydediliyor…" : "Yolu güncelle (ders listesine yansır)"}
      </Button>
    </div>
  );
}
