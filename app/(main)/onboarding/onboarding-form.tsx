"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeLearningPath } from "@/actions/learning-path";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, GraduationCap, Users, ArrowLeft, ChevronRight } from "lucide-react";

const ProfileSchoolSelector = dynamic(
  () =>
    import("@/app/(main)/(protected)/profile/profile-school-selector").then(
      (m) => m.ProfileSchoolSelector,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 w-full animate-pulse rounded-xl bg-muted" aria-hidden />
    ),
  },
);

type Mode = "lgs" | "tyt_ayt" | "adult" | "";

export const OnboardingForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<Mode>("");
  const [grade, setGrade] = useState<number | "">("");
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const goStep2 = () => {
    if (mode === "") {
      toast.error("Bir yol seçin.");
      return;
    }
    if (mode === "lgs" && (grade === "" || grade < 5 || grade > 8)) {
      toast.error("5–8 arası sınıf seçin.");
      return;
    }
    if (mode === "tyt_ayt" && (grade === "" || grade < 9 || grade > 12)) {
      toast.error("9–12 arası sınıf seçin.");
      return;
    }
    setSchoolId(null);
    setStep(2);
  };

  const finish = () => {
    if (mode === "") return;
    const g = mode === "adult" ? null : (grade as number);

    if (mode === "lgs" || mode === "tyt_ayt") {
      if (schoolId == null) {
        toast.error("Devam etmek için bir okul seçmelisiniz.");
        return;
      }
    }

    startTransition(() => {
      completeLearningPath(mode, g, mode === "adult" ? schoolId : schoolId).then((r) => {
        if (r.ok) {
          toast.success("Harika! Profilin kaydedildi.");
          router.push("/courses");
        } else {
          toast.error(r.error);
        }
      });
    });
  };

  return (
    <div className="space-y-8 w-full max-w-md mx-auto">
      <p className="text-sm text-muted-foreground text-center">
        {step === 1 ? (
          <>
            Sana uygun ders ve sınavları gösterebilmemiz için önce yolunu ve sınıfını seç.
            <span className="block mt-1 text-xs text-muted-foreground">
              İngilizce içerikleri tüm yollarda açıktır. Sonraki adımda okulunu seçerek okul
              puan tablosuna katılırsın; okul ve sınıf değişiklikleri yılda birkaç kez ve 6 ay kilit
              sonrası yapılabilir.
            </span>
          </>
        ) : (
          <>
            Okulunu seç — puanların bu okula yazılır ve listede yer alırsın.
            <span className="block mt-1 text-xs text-muted-foreground">
              {mode === "adult"
                ? "İstersen atlayabilirsin; daha sonra profilden ekleyebilirsin."
                : "Ortaokul / lise için okul seçimi zorunludur."}
            </span>
          </>
        )}
      </p>

      {step === 1 && (
        <>
          <div className="space-y-3" role="radiogroup" aria-label="Öğrenme yolu">
            {[
              {
                id: "lgs" as const,
                title: "Ortaokul (5–8. sınıf) — LGS",
                icon: <BookOpen className="h-5 w-5" />,
              },
              {
                id: "tyt_ayt" as const,
                title: "Lise (9–12. sınıf) — TYT & AYT",
                icon: <Users className="h-5 w-5" />,
              },
              {
                id: "adult" as const,
                title: "Üniversite & mezun — KPSS, YDS, ALES, YDT",
                icon: <GraduationCap className="h-5 w-5" />,
              },
            ].map((opt) => (
              <button
                type="button"
                key={opt.id}
                role="radio"
                aria-checked={mode === opt.id}
                onClick={() => {
                  setMode(opt.id);
                  if (opt.id === "lgs" && (grade === "" || grade < 5 || grade > 8)) setGrade("");
                  if (opt.id === "tyt_ayt" && (grade === "" || grade < 9 || grade > 12))
                    setGrade("");
                }}
                className={[
                  "w-full flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition",
                  mode === opt.id
                    ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                    : "border-border bg-card hover:border-input",
                ].join(" ")}
              >
                <div
                  className={[
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    mode === opt.id ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {opt.icon}
                </div>
                <span className="text-sm font-semibold text-foreground pt-1.5">{opt.title}</span>
              </button>
            ))}
          </div>

          {mode === "lgs" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sınıfın</label>
              <select
                className="w-full rounded-xl border border-input p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={grade}
                onChange={(e) =>
                  setGrade(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                }
              >
                <option value="">Seçin</option>
                {[5, 6, 7, 8].map((g) => (
                  <option key={g} value={g}>
                    {g}. sınıf
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "tyt_ayt" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sınıfın</label>
              <select
                className="w-full rounded-xl border border-input p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                value={grade}
                onChange={(e) =>
                  setGrade(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                }
              >
                <option value="">Seçin</option>
                {[9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    {g}. sınıf
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="primary"
            className="w-full"
            size="lg"
            onClick={goStep2}
            disabled={pending || !mode}
          >
            Okul seçimine geç
            <ChevronRight className="inline ml-1 h-4 w-4" />
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </button>

          <ProfileSchoolSelector
            schools={[]}
            initialSchoolId={schoolId}
            onSelect={(id) => setSchoolId(id)}
          />

          <div className="flex flex-col gap-2">
            {mode === "adult" && (
              <Button type="button" variant="primaryOutline" className="w-full" onClick={finish} disabled={pending}>
                Okul seçmeden devam et
              </Button>
            )}
            <Button variant="primary" className="w-full" size="lg" onClick={finish} disabled={pending}>
              {pending ? "Kaydediliyor…" : "Tamamla ve derslere git"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
