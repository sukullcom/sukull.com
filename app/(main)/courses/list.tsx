"use client";

import { courses, userProgress } from "@/db/schema";
import { Card } from "./card";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useCallback, memo, useEffect, useRef, useState, useMemo } from "react";
import { upsertUserProgress } from "@/actions/user-progress";
import { toast } from "sonner";
import { Search } from "lucide-react";

type Props = {
  courses: (typeof courses.$inferSelect)[];
  activeCourseId?: (typeof userProgress.$inferSelect)["activeCourseId"];
};

type Category = {
  key: string;
  label: string;
  emoji: string;
};

const CATEGORIES: Category[] = [
  { key: "all", label: "Tümü", emoji: "📚" },
  { key: "matematik", label: "Matematik", emoji: "🔢" },
  { key: "turkce", label: "Türkçe / Edebiyat", emoji: "📖" },
  { key: "fen", label: "Fen Bilimleri", emoji: "🔬" },
  { key: "fizik", label: "Fizik", emoji: "⚛️" },
  { key: "ingilizce", label: "İngilizce", emoji: "🌍" },
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

const MemoizedCard = memo(Card);

export const List = ({ courses, activeCourseId }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const toastShownRef = useRef(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredCourses = useMemo(() => {
    let result = [...courses];
    if (activeCategory !== "all") {
      result = result.filter((c) => categorize(c.title) === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
    result.sort((a, b) => extractSortKey(a.title) - extractSortKey(b.title));
    return result;
  }, [courses, activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: courses.length };
    courses.forEach((c) => {
      const cat = categorize(c.title);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [courses]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ders ara..."
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200 transition-colors bg-white"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.filter(
          (cat) => cat.key === "all" || (categoryCounts[cat.key] ?? 0) > 0
        ).map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.key
                ? "bg-sky-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            <span
              className={`text-xs ml-0.5 ${
                activeCategory === cat.key
                  ? "text-sky-100"
                  : "text-gray-400"
              }`}
            >
              {categoryCounts[cat.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredCourses.map((course) => (
          <MemoizedCard
            key={course.id}
            id={course.id}
            title={course.title}
            imageSrc={course.imageSrc}
            onClick={onClick}
            disabled={pending}
            active={course.id === activeCourseId}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">Sonuç bulunamadı</p>
          <p className="text-sm mt-1">
            Farklı bir kategori veya arama terimi deneyin.
          </p>
        </div>
      )}
    </div>
  );
};
