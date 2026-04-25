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
 * Filter bar for /listings (browse). Mirrors TeachersDirectoryFilters
 * but binds to `subject`, `lessonMode`, `city` — which are the keys
 * accepted by `getOpenListings`.
 */
export function ListingsFilters({
  initialSubject,
  initialLessonMode,
  initialCity,
}: {
  initialSubject: string;
  initialLessonMode: string;
  initialCity: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [, startTransition] = useTransition();

  const [subject, setSubject] = useState(initialSubject);
  const [lessonMode, setLessonMode] = useState(initialLessonMode);
  const [city, setCity] = useState(initialCity);

  const push = (next: {
    subject?: string;
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
    setSubject("");
    setLessonMode("");
    setCity("");
    startTransition(() => {
      router.replace("?");
    });
  };

  const hasAny = Boolean(subject || lessonMode || city);

  return (
    <div className="mb-4 bg-white border rounded-xl p-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onBlur={() => push({ subject, lessonMode, city })}
            onKeyDown={(e) => {
              if (e.key === "Enter") push({ subject, lessonMode, city });
            }}
            placeholder="Konu (örn. Matematik)"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20"
          />
        </div>
        <select
          value={lessonMode}
          onChange={(e) => {
            setLessonMode(e.target.value);
            push({ subject, lessonMode: e.target.value, city });
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
          onBlur={() => push({ subject, lessonMode, city })}
          onKeyDown={(e) => {
            if (e.key === "Enter") push({ subject, lessonMode, city });
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
