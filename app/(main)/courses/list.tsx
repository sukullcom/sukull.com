"use client";

import { courses, userProgress } from "@/db/schema";
import { Card } from "./card";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useCallback, useEffect, useRef, useMemo } from "react";
import { upsertUserProgress } from "@/actions/user-progress";
import { toast } from "sonner";

type Props = {
  courses: (typeof courses.$inferSelect)[];
  activeCourseId?: (typeof userProgress.$inferSelect)["activeCourseId"];
};

type GradeGroup = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  gradient: string;
  courses: (typeof courses.$inferSelect)[];
};

type TopicGroup = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  gradient: string;
  courses: (typeof courses.$inferSelect)[];
};

const GRADE_META: Record<number, { emoji: string; color: string; gradient: string }> = {
  5:  { emoji: "5️⃣", color: "text-sky-700",     gradient: "from-sky-500 to-sky-600" },
  6:  { emoji: "6️⃣", color: "text-cyan-700",    gradient: "from-cyan-500 to-cyan-600" },
  7:  { emoji: "7️⃣", color: "text-teal-700",    gradient: "from-teal-500 to-teal-600" },
  8:  { emoji: "8️⃣", color: "text-emerald-700", gradient: "from-emerald-500 to-emerald-600" },
  9:  { emoji: "9️⃣", color: "text-blue-700",    gradient: "from-blue-500 to-blue-600" },
  10: { emoji: "🔟", color: "text-indigo-700",  gradient: "from-indigo-500 to-indigo-600" },
  11: { emoji: "1️⃣1️⃣", color: "text-violet-700",  gradient: "from-violet-500 to-violet-600" },
  12: { emoji: "1️⃣2️⃣", color: "text-purple-700",  gradient: "from-purple-500 to-purple-600" },
};

const TOPIC_META: Record<string, { label: string; emoji: string; color: string; gradient: string }> = {
  ingilizce: { label: "İngilizce", emoji: "🌍", color: "text-rose-700", gradient: "from-rose-400 to-rose-500" },
  diger:     { label: "Diğer",     emoji: "📚", color: "text-gray-700", gradient: "from-gray-500 to-gray-600" },
};

function parseGrade(title: string): number | null {
  const m = title.match(/(\d+)\.\s*[Ss]ınıf/);
  return m ? parseInt(m[1], 10) : null;
}

function detectTopic(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("ingilizce") || t.includes("english")) return "ingilizce";
  return "diger";
}

function extractSubject(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("matematik")) return "Matematik";
  if (t.includes("türkçe") || t.includes("türk dili") || t.includes("edebiyat")) return "Türkçe";
  if (t.includes("fen bilimleri")) return "Fen Bilimleri";
  if (t.includes("fizik")) return "Fizik";
  if (t.includes("kimya")) return "Kimya";
  if (t.includes("biyoloji")) return "Biyoloji";
  if (t.includes("tarih")) return "Tarih";
  if (t.includes("coğrafya")) return "Coğrafya";
  return title.replace(/\d+\.\s*[Ss]ınıf\s*/, "").trim();
}

function extractTopicLabel(title: string): string {
  const engMatch = title.match(/[(\s](A1|A2|B1|B2|C1|C2)[)\s]/i);
  if (engMatch) return engMatch[1].toUpperCase();
  const levelMatch = title.match(/(Başlangıç|Temel|Orta|Üst Orta|İleri)/i);
  if (levelMatch) return levelMatch[1];
  return title;
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
};

export const List = ({ courses, activeCourseId }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const toastShownRef = useRef(false);

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

  const { gradeGroups, topicGroups } = useMemo(() => {
    const grades: Record<number, (typeof courses.$inferSelect)[]> = {};
    const topics: Record<string, (typeof courses.$inferSelect)[]> = {};

    courses.forEach((course) => {
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

    const subjectOrder = ["Matematik", "Türkçe", "Fen Bilimleri", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya"];
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

    const sortedGradeKeys = Object.keys(grades).map(Number).sort((a, b) => a - b);
    const gradeGroups: GradeGroup[] = sortedGradeKeys.map((g) => {
      const meta = GRADE_META[g] || { emoji: "📘", color: "text-gray-700", gradient: "from-gray-500 to-gray-600" };
      return {
        key: `grade-${g}`,
        label: `${g}. Sınıf`,
        emoji: meta.emoji,
        color: meta.color,
        gradient: meta.gradient,
        courses: grades[g],
      };
    });

    const topicKeys = ["ingilizce", "diger"];
    const topicGroups: TopicGroup[] = topicKeys
      .filter((k) => topics[k]?.length)
      .map((k) => {
        const meta = TOPIC_META[k] || TOPIC_META.diger;
        return {
          key: k,
          label: meta.label,
          emoji: meta.emoji,
          color: meta.color,
          gradient: meta.gradient,
          courses: topics[k],
        };
      });

    return { gradeGroups, topicGroups };
  }, [courses]);

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">Henüz kurs bulunmuyor</p>
      </div>
    );
  }

  const renderSection = (
    group: { key: string; label: string; emoji: string; color: string; gradient: string; courses: (typeof courses.$inferSelect)[] },
    mode: "grade" | "topic"
  ) => (
    <section key={group.key}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center text-lg shadow-sm`}
        >
          <span className="text-sm">{group.emoji}</span>
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

  return (
    <div className="space-y-10">
      {gradeGroups.map((g) => renderSection(g, "grade"))}
      {topicGroups.map((g) => renderSection(g, "topic"))}
    </div>
  );
};
