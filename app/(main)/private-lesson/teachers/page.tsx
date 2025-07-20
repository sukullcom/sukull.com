"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectItem, SelectValue } from "@/components/ui/select";
import { Star, Filter } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import UserCreditsDisplay from "@/components/user-credits-display";

interface Teacher {
  id: string;
  name: string;
  email: string;
  bio?: string;
  meetLink?: string;
  avatar?: string;
  field?: string;
  fields?: string[];
  averageRating?: number;
  totalReviews?: number;
}

const FIELD_OPTIONS = [
  { value: "all", label: "Bütün Alanlar" },
  { value: "Matematik", label: "Matematik" },
  { value: "Fizik", label: "Fizik" },
  { value: "Kimya", label: "Kimya" },
  { value: "Biyoloji", label: "Biyoloji" },
  { value: "Tarih", label: "Tarih" },
  { value: "Coğrafya", label: "Coğrafya" },
  { value: "Edebiyat", label: "Edebiyat" },
  { value: "İngilizce", label: "İngilizce" },
  { value: "Almanca", label: "Almanca" },
  { value: "Fransızca", label: "Fransızca" },
  { value: "Felsefe", label: "Felsefe" },
  { value: "Müzik", label: "Müzik" },
  { value: "Resim", label: "Resim" },
  { value: "Bilgisayar Bilimleri", label: "Bilgisayar Bilimleri" },
  { value: "Ekonomi", label: "Ekonomi" },
];

export default function TeachersPage() {
  const router = useRouter();
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTeachers = useCallback(async (field: string = "all") => {
    try {
      setLoading(true);
      const url = field === "all" 
        ? "/api/private-lesson/available-teachers"
        : `/api/private-lesson/available-teachers?field=${encodeURIComponent(field)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          // Not an approved student, redirect to main page
          router.push("/private-lesson");
          return;
        }
        throw new Error("Failed to fetch teachers");
      }
      
      const data = await response.json();
      setFilteredTeachers(data.teachers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setError("Failed to load teachers. Please try again later.");
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (mounted) {
      fetchTeachers(selectedField);
    }
  }, [selectedField, fetchTeachers, mounted]);

  const handleFieldChange = (field: string) => {
    setSelectedField(field);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={() => router.push("/private-lesson")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      {/* User Credits Display */}
      <UserCreditsDisplay className="mb-6" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Öğretmenler</h1>
        
        {/* Field Filter */}
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <Select 
            value={selectedField} 
            onValueChange={handleFieldChange}
            className="w-[200px]"
          >
            <SelectValue placeholder="Alan Seçin" />
            {FIELD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">
            {selectedField === "all" 
              ? "Şu anda müsait öğretmen bulunmuyor." 
              : "Bu alanda öğretmen bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow border flex flex-col h-full">
              <CardHeader className="flex-shrink-0">
                <div className="flex justify-center mb-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-primary/20">
                    <Image
                      src={teacher.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teacher.name)}`}
                      alt={teacher.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">{teacher.name}</CardTitle>
                {teacher.field && (
                  <div className="text-center mt-2">
                    {teacher.fields && teacher.fields.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {teacher.fields.map((field, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <CardDescription className="font-medium text-primary">
                        {teacher.field}
                      </CardDescription>
                    )}
                  </div>
                )}
                {/* Rating Display */}
                {teacher.averageRating && teacher.averageRating > 0 && teacher.totalReviews && teacher.totalReviews > 0 ? (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="flex">
                      {renderStars(Math.round(teacher.averageRating))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {teacher.averageRating.toFixed(1)} ({teacher.totalReviews} değerlendirme)
                    </span>
                  </div>
                ) : (
                  <div className="text-center mt-2">
                    <span className="text-sm text-gray-500">Henüz Değerlendirme Yok</span>
                  </div>
                )}
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button 
                  variant="primary"
                  className="w-full" 
                  onClick={() => router.push(`/private-lesson/teachers/${teacher.id}`)}
                >
                  Programa Bak
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 

