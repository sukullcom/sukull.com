"use client";

import { courses, userProgress } from "@/db/schema";
import { Card } from "./card";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useCallback, useEffect, useRef, useMemo, useState } from "react";
import { upsertUserProgress } from "@/actions/user-progress";
import { toast } from "sonner";
import { extractSubject } from "@/lib/subject-colors";
import { Globe, BookOpen, GraduationCap, Lock } from "lucide-react";

type Props = {
  courses: (typeof courses.$inferSelect)[];
  activeCourseId?: (typeof userProgress.$inferSelect)["activeCourseId"];
};

type SectionGroup = {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  courses: (typeof courses.$inferSelect)[];
};

const GRADE_META: Record<number, { icon: React.ReactNode; color: string; gradient: string }> = {
  5:  { icon: <span className="text-white font-bold text-sm">5</span>, color: "text-sky-700",     gradient: "from-sky-500 to-sky-600" },
  6:  { icon: <span className="text-white font-bold text-sm">6</span>, color: "text-cyan-700",    gradient: "from-cyan-500 to-cyan-600" },
  7:  { icon: <span className="text-white font-bold text-sm">7</span>, color: "text-teal-700",    gradient: "from-teal-500 to-teal-600" },
  8:  { icon: <span className="text-white font-bold text-sm">8</span>, color: "text-emerald-700", gradient: "from-emerald-500 to-emerald-600" },
  9:  { icon: <span className="text-white font-bold text-sm">9</span>, color: "text-blue-700",    gradient: "from-blue-500 to-blue-600" },
  10: { icon: <span className="text-white font-bold text-sm">10</span>, color: "text-indigo-700",  gradient: "from-indigo-500 to-indigo-600" },
  11: { icon: <span className="text-white font-bold text-sm">11</span>, color: "text-violet-700",  gradient: "from-violet-500 to-violet-600" },
  12: { icon: <span className="text-white font-bold text-sm">12</span>, color: "text-purple-700",  gradient: "from-purple-500 to-purple-600" },
};

const TOPIC_META: Record<string, { label: string; icon: React.ReactNode; color: string; gradient: string }> = {
  ingilizce: { label: "İngilizce", icon: <Globe className="w-5 h-5 text-white" />, color: "text-rose-700", gradient: "from-rose-400 to-rose-500" },
  diger:     { label: "Diğer",     icon: <BookOpen className="w-5 h-5 text-white" />, color: "text-gray-700", gradient: "from-gray-500 to-gray-600" },
};

// ─── Exam definitions ──────────────────────────────────────────────────────
// Order matches the way most students progress through them.
const EXAMS: Array<{
  key: string;
  label: string;
  description: string;
  color: string;
  gradient: string;
}> = [
  { key: "LGS",  label: "LGS",  description: "Liselere Geçiş Sınavı",           color: "text-amber-700",   gradient: "from-amber-500 to-orange-500" },
  { key: "TYT",  label: "TYT",  description: "Temel Yeterlilik Testi",          color: "text-rose-700",    gradient: "from-rose-500 to-pink-500" },
  { key: "AYT",  label: "AYT",  description: "Alan Yeterlilik Testi",           color: "text-fuchsia-700", gradient: "from-fuchsia-500 to-purple-500" },
  { key: "YDT",  label: "YDT",  description: "Yabancı Dil Testi",               color: "text-pink-700",    gradient: "from-pink-500 to-rose-500" },
  { key: "KPSS", label: "KPSS", description: "Kamu Personel Seçme Sınavı",      color: "text-emerald-700", gradient: "from-emerald-500 to-green-600" },
  { key: "ALES", label: "ALES", description: "Akademik Personel ve Lisansüstü", color: "text-blue-700",    gradient: "from-blue-500 to-indigo-600" },
  { key: "YDS",  label: "YDS",  description: "Yabancı Dil Sınavı",              color: "text-cyan-700",    gradient: "from-cyan-500 to-sky-600" },
];

function parseGrade(title: string): number | null {
  const m = title.match(/(\d+)\.\s*[Ss]ınıf/);
  return m ? parseInt(m[1], 10) : null;
}

function detectExam(title: string): string | null {
  const t = title.toUpperCase();
  for (const exam of EXAMS) {
    // Match exam code at word boundaries to avoid false positives.
    const re = new RegExp(`\\b${exam.key}\\b`);
    if (re.test(t)) return exam.key;
  }
  return null;
}

function detectTopic(title: string): string {
  const t = title.toLocaleLowerCase("tr");
  if (t.includes("ingilizce") || t.includes("english")) return "ingilizce";
  return "diger";
}

function extractTopicLabel(title: string): string {
  const engMatch = title.match(/[(\s](A1|A2|B1|B2|C1|C2)[)\s]/i);
  if (engMatch) return engMatch[1].toUpperCase();
  const levelMatch = title.match(/(Başlangıç|Temel|Orta|Üst Orta|İleri)/i);
  if (levelMatch) return levelMatch[1];
  return title;
}

function extractExamCourseLabel(title: string, examKey: string): string {
  // Remove the exam key prefix so the card label stays short and readable.
  const cleaned = title.replace(new RegExp(`\\b${examKey}\\b[\\s:\\-–—]*`, "i"), "").trim();
  return cleaned || extractSubject(title);
}

const SUBJECT_STYLES: Record<string, string> = {
  "Matematik": "matematik",
  "Türkçe": "turkce",
  "Fen Bilimleri": "fen",
  "Fizik": "fizik",
  "Kimya": "kimya",
  "Biyoloji": "biyoloji",
  "Tarih": "tarih",
  "Coğrafya": "cografya",
  "Felsefe": "felsefe",
  "Din Kültürü": "dinkulturu",
  "Sosyal Bilgiler": "sosyal",
};

type TabKey = "school" | "exams";

export const List = ({ courses, activeCourseId }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const toastShownRef = useRef(false);

  const urlTab = (searchParams.get("tab") as TabKey | null) ?? "school";
  const [activeTab, setActiveTab] = useState<TabKey>(
    urlTab === "exams" ? "exams" : "school"
  );

  // Keep URL in sync so the tab choice can be shared/bookmarked.
  useEffect(() => {
    const current = searchParams.get("tab");
    if (activeTab === "school" && current) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("tab");
      window.history.replaceState({}, "", newUrl.toString());
    } else if (activeTab === "exams" && current !== "exams") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("tab", "exams");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "select-course" && !toastShownRef.current) {
      toast.info("Öğrenmeye başlamak için önce bir ders seçmelisiniz!");
      toastShownRef.current = true;
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("message");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  const onClick = useCallback(
    (id: number) => {
      if (pending) return;
      if (id === activeCourseId) {
        return router.push("/learn");
      }
      startTransition(() => {
        upsertUserProgress(id)
          .then(() => router.push("/learn"))
          .catch(() =>
            toast.error("Ders ilerlemeniz güncellenirken bir hata oluştu.")
          );
      });
    },
    [pending, activeCourseId, router]
  );

  const { gradeGroups, topicGroups, examGroups } = useMemo(() => {
    const grades: Record<number, (typeof courses.$inferSelect)[]> = {};
    const topics: Record<string, (typeof courses.$inferSelect)[]> = {};
    const exams: Record<string, (typeof courses.$inferSelect)[]> = {};

    courses.forEach((course) => {
      const examKey = detectExam(course.title);
      if (examKey) {
        if (!exams[examKey]) exams[examKey] = [];
        exams[examKey].push(course);
        return;
      }

      const grade = parseGrade(course.title);
      if (grade !== null) {
        if (!grades[grade]) grades[grade] = [];
        grades[grade].push(course);
      } else {
        const topic = detectTopic(course.title);
        if (!topics[topic]) topics[topic] = [];
        topics[topic].push(course);
      }
    });

    const subjectOrder = ["Matematik", "Türkçe", "Fen Bilimleri", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya", "Felsefe", "Din Kültürü", "Sosyal Bilgiler"];
    Object.values(grades).forEach((arr) =>
      arr.sort((a, b) => {
        const sa = extractSubject(a.title);
        const sb = extractSubject(b.title);
        const ia = subjectOrder.indexOf(sa);
        const ib = subjectOrder.indexOf(sb);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
    );

    const levelOrder: Record<string, number> = { a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6 };
    Object.values(topics).forEach((arr) =>
      arr.sort((a, b) => {
        const la = a.title.toLowerCase().match(/[abc][12]/)?.[0] ?? "";
        const lb = b.title.toLowerCase().match(/[abc][12]/)?.[0] ?? "";
        return (levelOrder[la] ?? 99) - (levelOrder[lb] ?? 99);
      })
    );

    Object.values(exams).forEach((arr) =>
      arr.sort((a, b) => {
        const sa = extractSubject(a.title);
        const sb = extractSubject(b.title);
        const ia = subjectOrder.indexOf(sa);
        const ib = subjectOrder.indexOf(sb);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
    );

    const sortedGradeKeys = Object.keys(grades).map(Number).sort((a, b) => a - b);
    const gradeGroups: SectionGroup[] = sortedGradeKeys.map((g) => {
      const meta = GRADE_META[g] || { icon: <BookOpen className="w-5 h-5 text-white" />, color: "text-gray-700", gradient: "from-gray-500 to-gray-600" };
      return {
        key: `grade-${g}`,
        label: `${g}. Sınıf`,
        icon: meta.icon,
        color: meta.color,
        gradient: meta.gradient,
        courses: grades[g],
      };
    });

    const topicKeys = ["ingilizce", "diger"];
    const topicGroups: SectionGroup[] = topicKeys
      .filter((k) => topics[k]?.length)
      .map((k) => {
        const meta = TOPIC_META[k] || TOPIC_META.diger;
        return {
          key: k,
          label: meta.label,
          icon: meta.icon,
          color: meta.color,
          gradient: meta.gradient,
          courses: topics[k],
        };
      });

    const examGroups = EXAMS.map((e) => ({
      key: `exam-${e.key}`,
      label: e.label,
      description: e.description,
      color: e.color,
      gradient: e.gradient,
      courses: exams[e.key] ?? [],
    }));

    return { gradeGroups, topicGroups, examGroups };
  }, [courses]);

  const totalSchoolCourses = gradeGroups.reduce((n, g) => n + g.courses.length, 0)
    + topicGroups.reduce((n, g) => n + g.courses.length, 0);
  const totalExamCourses = examGroups.reduce((n, g) => n + g.courses.length, 0);

  const renderSection = (
    group: SectionGroup,
    mode: "grade" | "topic"
  ) => (
    <section key={group.key}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center text-lg shadow-sm`}
        >
          {group.icon}
        </div>
        <div>
          <h2 className={`text-lg font-bold ${group.color}`}>
            {group.label}
          </h2>
          <p className="text-xs text-gray-400">
            {group.courses.length} ders
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:overflow-visible">
        {group.courses.map((course) => {
          const cardLabel = mode === "grade"
            ? extractSubject(course.title)
            : extractTopicLabel(course.title);
          const cardCategory = mode === "grade"
            ? SUBJECT_STYLES[extractSubject(course.title)] || "diger"
            : "ingilizce";

          return (
            <Card
              key={course.id}
              id={course.id}
              title={course.title}
              label={cardLabel}
              imageSrc={course.imageSrc}
              onClick={onClick}
              disabled={pending}
              active={course.id === activeCourseId}
              category={cardCategory}
            />
          );
        })}
      </div>
    </section>
  );

  const renderExamSection = (group: {
    key: string;
    label: string;
    description: string;
    color: string;
    gradient: string;
    courses: (typeof courses.$inferSelect)[];
  }) => (
    <section key={group.key}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center shadow-sm`}
        >
          <span className="text-white font-bold text-[11px] leading-none">{group.label}</span>
        </div>
        <div>
          <h2 className={`text-lg font-bold ${group.color}`}>
            {group.label}
          </h2>
          <p className="text-xs text-gray-400">
            {group.description}
            {group.courses.length > 0 && ` · ${group.courses.length} ders`}
          </p>
        </div>
      </div>

      {group.courses.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:overflow-visible">
          {group.courses.map((course) => (
            <Card
              key={course.id}
              id={course.id}
              title={course.title}
              label={extractExamCourseLabel(course.title, group.label)}
              imageSrc={course.imageSrc}
              onClick={onClick}
              disabled={pending}
              active={course.id === activeCourseId}
              category={SUBJECT_STYLES[extractSubject(course.title)] || "diger"}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-600">Yakında</p>
            <p className="text-xs text-gray-400 truncate">
              {group.label} içerikleri hazırlanıyor.
            </p>
          </div>
        </div>
      )}
    </section>
  );

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">Henüz kurs bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Tabs ───────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 bg-gradient-to-b from-white via-white to-white/0 pt-1 pb-3">
        <div
          role="tablist"
          aria-label="Ders kategorileri"
          className="mx-4 sm:mx-6 inline-flex rounded-2xl bg-gray-100 p-1 shadow-sm"
        >
          <button
            role="tab"
            aria-selected={activeTab === "school"}
            onClick={() => setActiveTab("school")}
            className={[
              "flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm font-semibold transition-all",
              activeTab === "school"
                ? "bg-white text-neutral-800 shadow"
                : "text-neutral-500 hover:text-neutral-700",
            ].join(" ")}
          >
            <BookOpen className="h-4 w-4" />
            <span>Okul Dersleri</span>
            <span
              className={[
                "ml-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold",
                activeTab === "school"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-500",
              ].join(" ")}
            >
              {totalSchoolCourses}
            </span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "exams"}
            onClick={() => setActiveTab("exams")}
            className={[
              "flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm font-semibold transition-all",
              activeTab === "exams"
                ? "bg-white text-neutral-800 shadow"
                : "text-neutral-500 hover:text-neutral-700",
            ].join(" ")}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Sınavlar</span>
            <span
              className={[
                "ml-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold",
                activeTab === "exams"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-200 text-gray-500",
              ].join(" ")}
            >
              {totalExamCourses}
            </span>
          </button>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────────────────── */}
      {activeTab === "school" ? (
        <div className="space-y-10">
          {gradeGroups.map((g) => renderSection(g, "grade"))}
          {topicGroups.map((g) => renderSection(g, "topic"))}
        </div>
      ) : (
        <div className="space-y-10">
          {examGroups.map((g) => renderExamSection(g))}
        </div>
      )}
    </div>
  );
};
