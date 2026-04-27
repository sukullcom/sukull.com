"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeLearningPath } from "@/actions/learning-path";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, GraduationCap, Users } from "lucide-react";

type Mode = "lgs" | "tyt_ayt" | "adult" | "";

export const OnboardingForm = () => {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("");
  const [grade, setGrade] = useState<number | "">("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
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
    const g = mode === "adult" ? null : (grade as number);
    startTransition(() => {
      completeLearningPath(mode, g).then((r) => {
        if (r.ok) {
          toast.success("Harika! Derslerin senin için listeleniyor.");
          router.push("/courses");
        } else {
          toast.error(r.error);
        }
      });
    });
  };

  return (
    <div className="space-y-8 w-full max-w-md mx-auto">
      <p className="text-sm text-neutral-600 text-center">
        Sana uygun ders ve sınavları gösterebilmemiz için sınıf veya yol bilgini seç.
        <span className="block mt-1 text-xs text-neutral-500">
          İngilizce içerikleri tüm yollarda açık tutulur; sınav ve sınıf listeleri seçimine göre
          sadeleştirilir. Sonradan <strong className="font-medium">Profil &gt; Ayarlar</strong> üzerinden, yılda
          sınırlı değişiklikle güncelleyebilirsin.
        </span>
      </p>

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
              if (opt.id === "tyt_ayt" && (grade === "" || grade < 9 || grade > 12)) setGrade("");
            }}
            className={[
              "w-full flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition",
              mode === opt.id
                ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300",
            ].join(" ")}
          >
            <div
              className={[
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                mode === opt.id
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600",
              ].join(" ")}
            >
              {opt.icon}
            </div>
            <span className="text-sm font-semibold text-neutral-800 pt-1.5">{opt.title}</span>
          </button>
        ))}
      </div>

      {mode === "lgs" && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Sınıfın</label>
          <select
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            value={grade}
            onChange={(e) => setGrade(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
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
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Sınıfın</label>
          <select
            className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            value={grade}
            onChange={(e) => setGrade(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
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
        onClick={submit}
        disabled={pending || !mode}
      >
        {pending ? "Kaydediliyor…" : "Devam et, dersleri göster"}
      </Button>
    </div>
  );
};
