"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function PrivateLessonPage() {
  const router = useRouter();
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if the user is a teacher
  useEffect(() => {
    const checkTeacherStatus = async () => {
      try {
        const response = await fetch("/api/private-lesson/check-teacher-status");
        const data = await response.json();
        
        setIsTeacher(data.teacher);
        setLoading(false);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setLoading(false);
      }
    };

    checkTeacherStatus();
  }, []);

  const handleOptionClick = (option: string) => {
    if (option === "get") {
      router.push("/private-lesson/get");
    } else if (option === "give") {
      router.push("/private-lesson/give");
    } else if (option === "group") {
      router.push("/private-lesson/group");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Teacher view
  if (isTeacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
        <div className="relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8">
          <Image
            src="/hero.svg"
            alt="Hero Görseli"
            fill
            className="object-contain"
          />
        </div>

        <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Öğretmen Paneli
          </h1>
          <p className="text-center text-gray-600">
            Tebrikler! Artık onaylı bir öğretmensiniz. Öğrencilerden gelen talepleri burada görebilirsiniz.
          </p>
          <div className="flex flex-col space-y-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/private-lesson/teacher-dashboard")}
            >
              Öğrenci Taleplerini Görüntüle
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Regular user view
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8">
        <Image
          src="/hero.svg"
          alt="Hero Görseli"
          fill
          className="object-contain"
        />
      </div>

      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Özel Ders
        </h1>
        <div className="flex flex-col space-y-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleOptionClick("give")}
          >
            Özel Ders Vermek İstİyorum
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleOptionClick("get")}
          >
            Özel Ders Almak İstİyorum
          </Button>
          <Button
          className="text-xs"
            variant="danger"
            size="lg"
            onClick={() => handleOptionClick("group")}
          >
            İngİlİzce Konuşma Gruplarına Katılmak İstİyorum
          </Button>
        </div>
      </div>
    </div>
  );
}
