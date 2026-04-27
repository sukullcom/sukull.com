"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateLearningPathFromSettings } from "@/actions/learning-path";
import { Button } from "@/components/ui/button";
import {
  canChangeLearningPath,
  LEARNING_PATH_DAYS_BETWEEN_CHANGES,
  LEARNING_PATH_MAX_CHANGES,
} from "@/lib/learning-path";
import { BookOpen, GraduationCap, Lock, Users } from "lucide-react";

type Mode = "lgs" | "tyt_ayt" | "adult" | "full" | "";

type Props = {
  initialPath: string | null;
  initialGrade: number | null;
  learningPathLastSetAt: Date | string | null;
  learningPathChangeCount: number;
  onboardingCompletedAt: Date | string | null;
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

export function ProfileLearningPath({ initialPath, initialGrade, learningPathLastSetAt, learningPathChangeCount, onboardingCompletedAt }: Props) {
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
      learningPathChangeCount ?? 0
    );
  }, [onboardingCompletedAt, learningPathLastSetAt, learningPathChangeCount]);

  const canEdit = policy.allowed;

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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Öğrenme yolu</h3>
        <p className="text-sm text-gray-600">
          Şu an: <strong className="text-gray-800">{pathLabel[initialPath ?? "full"] ?? "—"}</strong>
          {initialPath !== "adult" && initialGrade != null && (
            <span className="ml-1">· {initialGrade}. sınıf</span>
          )}
        </p>
        <p className="text-xs text-amber-700/90 mt-2">
          {initialPath === "full"
            ? "Kataloğu sadeleştirmek için aşağıdan bir yol seçebilirsin (değişiklik, kurallar dahilinde sınırlı sayıda)."
            : `Yol değişimleri en az ${LEARNING_PATH_DAYS_BETWEEN_CHANGES} gün arayla, toplam en fazla ${LEARNING_PATH_MAX_CHANGES} kez yapılabiliyor. Okulun ise istikrar beklemeden dilediğin gibi değişir.`}
        </p>
        {!canEdit && policy.reason === "cooldown" && policy.nextAllowedAt && (
          <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Sonraki değişim: {policy.nextAllowedAt.toLocaleString("tr-TR")}
          </p>
        )}
        {!canEdit && policy.reason === "max" && (
          <p className="text-xs text-rose-600 mt-1">Maksimum değişim sayısına ulaşıldı.</p>
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
              mode === opt.id ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200",
            ].join(" ")}
          >
            {opt.icon}
            {opt.title}
          </button>
        ))}

        {mode === "lgs" && (
          <select
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
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
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
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
