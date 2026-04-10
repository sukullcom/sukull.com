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

type CategoryInfo = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  gradient: string;
};

const CATEGORIES: CategoryInfo[] = [
  { key: "matematik", label: "Matematik", emoji: "🔢", color: "text-blue-700", gradient: "from-blue-500 to-blue-600" },
  { key: "turkce", label: "Türkçe / Edebiyat", emoji: "📖", color: "text-orange-700", gradient: "from-orange-400 to-orange-500" },
  { key: "fen", label: "Fen Bilimleri", emoji: "🔬", color: "text-emerald-700", gradient: "from-emerald-500 to-emerald-600" },
  { key: "fizik", label: "Fizik", emoji: "⚛️", color: "text-purple-700", gradient: "from-purple-500 to-purple-600" },
  { key: "ingilizce", label: "İngilizce", emoji: "🌍", color: "text-rose-700", gradient: "from-rose-400 to-rose-500" },
];

function categorize(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("matematik")) return "matematik";
  if (t.includes("türkçe") || t.includes("türk dili") || t.includes("edebiyat"))
    return "turkce";
  if (t.includes("fen bilimleri")) return "fen";
  if (t.includes("fizik")) return "fizik";
  if (t.includes("ingilizce") || t.includes("english")) return "ingilizce";
  return "diger";
}

function extractSortKey(title: string): number {
  const gradeMatch = title.match(/(\d+)\.\s*[Ss]ınıf/);
  if (gradeMatch) return parseInt(gradeMatch[1], 10);
  const levelMap: Record<string, number> = {
    a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6,
  };
  const levelMatch = title.toLowerCase().match(/[ab][12c][12]?/);
  if (levelMatch) return levelMap[levelMatch[0]] ?? 99;
  return 99;
}

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

  const groupedCourses = useMemo(() => {
    const groups: Record<string, (typeof courses.$inferSelect)[]> = {};
    courses.forEach((course) => {
      const cat = categorize(course.title);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(course);
    });
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => extractSortKey(a.title) - extractSortKey(b.title))
    );
    return groups;
  }, [courses]);

  return (
    <div className="space-y-10">
      {CATEGORIES.filter((cat) => groupedCourses[cat.key]?.length).map(
        (cat) => (
          <section key={cat.key}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-lg shadow-sm`}
              >
                <span>{cat.emoji}</span>
              </div>
              <div>
                <h2 className={`text-lg font-bold ${cat.color}`}>
                  {cat.label}
                </h2>
                <p className="text-xs text-gray-400">
                  {groupedCourses[cat.key].length} ders
                </p>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:overflow-visible">
              {groupedCourses[cat.key].map((course) => (
                <Card
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  imageSrc={course.imageSrc}
                  onClick={onClick}
                  disabled={pending}
                  active={course.id === activeCourseId}
                  category={cat.key}
                />
              ))}
            </div>
          </section>
        )
      )}

      {/* Kurslar boşsa */}
      {courses.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Henüz kurs bulunmuyor</p>
        </div>
      )}
    </div>
  );
};
