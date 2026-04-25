"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";

const LESSON_MODES = [
  { value: "", label: "Tüm ders tipleri" },
  { value: "online", label: "Online" },
  { value: "in_person", label: "Yüz yüze" },
];

/**
 * Search/filter bar for the teacher directory. Pushes filters into the
 * URL (`?field=&lessonMode=&city=`) so the server component above can
 * re-filter on the next render. `useTransition` keeps the input snappy
 * while the list revalidates.
 */
export function TeachersDirectoryFilters({
  initialField,
  initialLessonMode,
  initialCity,
}: {
  initialField: string;
  initialLessonMode: string;
  initialCity: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [, startTransition] = useTransition();

  const [field, setField] = useState(initialField);
  const [lessonMode, setLessonMode] = useState(initialLessonMode);
  const [city, setCity] = useState(initialCity);

  const push = (next: {
    field?: string;
    lessonMode?: string;
    city?: string;
  }) => {
    const params = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    startTransition(() => {
      router.replace(`?${params.toString()}`);
    });
  };

  const clear = () => {
    setField("");
    setLessonMode("");
    setCity("");
    startTransition(() => {
      router.replace("?");
    });
  };

  const hasAny = Boolean(field || lessonMode || city);

  return (
    <div className="mb-4 bg-white border rounded-xl p-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={field}
            onChange={(e) => setField(e.target.value)}
            onBlur={() => push({ field, lessonMode, city })}
            onKeyDown={(e) => {
              if (e.key === "Enter") push({ field, lessonMode, city });
            }}
            placeholder="Branş (örn. Matematik)"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20"
          />
        </div>
        <select
          value={lessonMode}
          onChange={(e) => {
            setLessonMode(e.target.value);
            push({ field, lessonMode: e.target.value, city });
          }}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20"
        >
          {LESSON_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onBlur={() => push({ field, lessonMode, city })}
          onKeyDown={(e) => {
            if (e.key === "Enter") push({ field, lessonMode, city });
          }}
          placeholder="Şehir"
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20"
        />
      </div>
      {hasAny && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
        >
          <X className="h-3 w-3" /> Filtreleri temizle
        </button>
      )}
    </div>
  );
}
