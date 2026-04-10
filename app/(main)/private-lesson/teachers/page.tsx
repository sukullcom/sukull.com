"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import UserCreditsDisplay from "@/components/user-credits-display";
import { normalizeAvatarUrl } from "@/utils/avatar";

interface Teacher {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  field?: string;
  fields?: string[];
  averageRating?: number;
  totalReviews?: number;
}

const FIELD_OPTIONS = [
  "Matematik", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya",
  "Edebiyat", "İngilizce", "Almanca", "Fransızca", "Felsefe",
  "Müzik", "Resim", "Bilgisayar Bilimleri", "Ekonomi",
];

export default function TeachersPage() {
  const router = useRouter();
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string>("all");

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/private-lesson/available-teachers");
      if (!response.ok) {
        if (response.status === 403) {
          router.push("/private-lesson");
          return;
        }
        throw new Error("Failed to fetch teachers");
      }
      const data = await response.json();
      setAllTeachers(data.teachers || []);
    } catch {
      setError("Öğretmenler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const filteredTeachers = useMemo(() => {
    if (selectedField === "all") return allTeachers;
    return allTeachers.filter((t) =>
      t.fields?.some((f) => f.toLowerCase().includes(selectedField.toLowerCase())) ||
      t.field?.toLowerCase().includes(selectedField.toLowerCase())
    );
  }, [allTeachers, selectedField]);

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <Button variant="default" onClick={() => router.push("/private-lesson")}>
          Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedField("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedField === "all"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tümü
        </button>
        {FIELD_OPTIONS.map((field) => (
          <button
            key={field}
            onClick={() => setSelectedField(field)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedField === field
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {field}
          </button>
        ))}
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">
            {selectedField === "all"
              ? "Şu anda müsait öğretmen bulunmuyor."
              : `"${selectedField}" alanında öğretmen bulunmuyor.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white border rounded-xl p-4 flex items-center gap-4 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => router.push(`/private-lesson/teachers/${teacher.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/private-lesson/teachers/${teacher.id}`)}
            >
              <Image
                src={normalizeAvatarUrl(teacher.avatar)}
                alt={teacher.name}
                width={56}
                height={56}
                unoptimized={teacher.avatar?.startsWith("http")}
                className="rounded-full object-cover w-12 h-12 sm:w-14 sm:h-14 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {teacher.name}
                </h3>
                {teacher.fields && teacher.fields.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {teacher.fields.map((f, i) => (
                      <span key={i} className="text-[10px] sm:text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
                {teacher.averageRating && teacher.averageRating > 0 ? (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.round(teacher.averageRating!)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {teacher.averageRating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ({teacher.totalReviews})
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-1">Henüz değerlendirme yok</p>
                )}
              </div>
              <span className="text-gray-300 text-lg shrink-0">›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
