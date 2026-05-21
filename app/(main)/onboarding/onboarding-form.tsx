"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeLearningPath } from "@/actions/learning-path";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BookOpen,
  GraduationCap,
  Users,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  School as SchoolIcon,
  Calendar,
  Sparkles,
} from "lucide-react";
import type { SelectedSchoolSummary } from "@/app/(main)/(protected)/profile/profile-school-selector";
import { UniversityPicker } from "@/app/(main)/onboarding/_components/university-picker";
import { SCHOOL_AND_GRADE_TRIAL_DAYS } from "@/lib/school-grade-lock";
import {
  formatStudentGradeLabel,
  isValidTytAytStudentGrade,
  TYT_AYT_GRADE_OPTIONS,
} from "@/lib/school-catalog";

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
type Step = 1 | 2 | 3;

const PATH_LABEL: Record<Exclude<Mode, "">, string> = {
  lgs: "Ortaokul (5–8) — LGS",
  tyt_ayt: "Lise (9–12) — TYT & AYT",
  adult: "Üniversite & mezun (KPSS, YDS, ALES, YDT)",
};

const CATEGORY_LABEL: Record<string, string> = {
  "Primary School": "İlkokul",
  "Secondary School": "Ortaokul",
  "High School": "Lise",
  University: "Üniversite",
};

export const OnboardingForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<Mode>("");
  const [grade, setGrade] = useState<number | "">("");
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [selectedSchool, setSelectedSchool] =
    useState<SelectedSchoolSummary | null>(null);
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
    if (mode === "tyt_ayt" && (grade === "" || !isValidTytAytStudentGrade(grade as number))) {
      toast.error("9–12 arası sınıf seçin.");
      return;
    }
    setSchoolId(null);
    setSelectedSchool(null);
    setStep(2);
  };

  const goReview = (opts?: { skipSchool?: boolean }) => {
    if (opts?.skipSchool) {
      setSchoolId(null);
      setSelectedSchool(null);
    } else if (mode === "lgs" || mode === "tyt_ayt") {
      if (schoolId == null) {
        toast.error("Devam etmek için bir okul seçmelisiniz.");
        return;
      }
    }
    setStep(3);
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
      completeLearningPath(mode, g, schoolId).then((r) => {
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
                  if (opt.id === "tyt_ayt" && (grade === "" || !isValidTytAytStudentGrade(grade as number)))
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
                {TYT_AYT_GRADE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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

          {/*
            Seçilen okulu "yapışkan" bir özet kartı olarak üstte gösteriyoruz.
            Selector listesinde yukarı/aşağı kaydırırken kullanıcı hangi okulu
            seçtiğini sürekli görür; aksi halde uzun listede "seçtim mi?" diye
            geri çıkmak zorundaydı.
          */}
          {selectedSchool && (
            <div
              role="status"
              aria-live="polite"
              className="sticky top-2 z-10 rounded-2xl border-2 border-suk-brand bg-suk-brand-soft/80 p-3 shadow-md backdrop-blur"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-suk-brand" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide text-suk-brand">
                    Seçildi
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-foreground truncate">
                    {selectedSchool.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {CATEGORY_LABEL[selectedSchool.category] ?? selectedSchool.category}
                    {" · "}
                    {selectedSchool.district}, {selectedSchool.city}
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === "adult" ? (
            // Üniversite & mezun: şehir / ilçe / kategori adımları gereksiz.
            // Tek bir aranabilir üniversite seçicisi gösteriyoruz; istek
            // hâlinde aşağıdaki "Okul seçmeden devam et" butonuyla atlanabilir.
            <UniversityPicker
              initialSchoolId={schoolId}
              onSelect={(id, details) => {
                setSchoolId(id);
                if (details) setSelectedSchool(details);
              }}
            />
          ) : (
            <ProfileSchoolSelector
              schools={[]}
              initialSchoolId={schoolId}
              onSelect={(id, details) => {
                setSchoolId(id);
                if (details) setSelectedSchool(details);
              }}
            />
          )}

          <div className="flex flex-col gap-2">
            {mode === "adult" && (
              <Button
                type="button"
                variant="primaryOutline"
                className="w-full"
                onClick={() => goReview({ skipSchool: true })}
                disabled={pending}
              >
                Okul seçmeden devam et
              </Button>
            )}
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={() => goReview()}
              disabled={pending || (mode !== "adult" && schoolId == null)}
            >
              Devam et
              <ChevronRight className="inline ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </button>

          <div className="rounded-2xl border-2 border-suk-brand/30 bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-suk-brand">
              <Sparkles className="h-5 w-5" />
              <h2 className="text-base font-bold text-foreground">Seçimlerini onayla</h2>
            </div>

            <ReviewRow
              icon={<BookOpen className="h-4 w-4" />}
              label="Öğrenme yolu"
              value={mode === "" ? "—" : PATH_LABEL[mode]}
            />
            {mode !== "adult" && grade !== "" && (
              <ReviewRow
                icon={<Users className="h-4 w-4" />}
                label="Sınıf"
                value={formatStudentGradeLabel(grade as number)}
              />
            )}
            <ReviewRow
              icon={<SchoolIcon className="h-4 w-4" />}
              label="Okul"
              value={
                selectedSchool
                  ? `${selectedSchool.name} · ${selectedSchool.district}, ${selectedSchool.city}`
                  : mode === "adult"
                    ? "Şimdilik atlandı (sonradan profilden ekleyebilirsin)"
                    : "—"
              }
            />
          </div>

          {selectedSchool && (
            <div className="flex items-start gap-2 rounded-xl border border-suk-warning-soft-fg/30 bg-suk-warning-soft p-3 text-sm text-suk-warning-soft-fg">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-semibold">Okul/sınıf değişimi kısıtlıdır</div>
                <p className="mt-1 text-xs leading-relaxed">
                  Lider tablosunun adil kalması için okul ve sınıf değişikliği genelde
                  altı ayda bir yapılabilir. <strong>İlk {SCHOOL_AND_GRADE_TRIAL_DAYS} gün</strong>
                  {" "}içinde dilediğin gibi değiştirebilirsin — sonrasında kilit devreye girer.
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Bu, üst-üste okul transferi ile puan oyunlamasını engellemek içindir.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button variant="primary" className="w-full" size="lg" onClick={finish} disabled={pending}>
              {pending ? "Kaydediliyor…" : "Onayla ve derslere başla"}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-sm text-muted-foreground"
              onClick={() => setStep(2)}
              disabled={pending}
            >
              Geri dönüp düzenle
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

function ReviewRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-suk-brand-soft text-suk-brand">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-sm font-medium text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}
