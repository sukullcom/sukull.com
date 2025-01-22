"use client";

import { useAudio } from "react-use";
import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function TeacherSuccessPage() {
  const router = useRouter();
  const [finishAudio] = useAudio({ src: "/finish.mp3", autoPlay: true });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      {finishAudio}
      <Confetti width={dimensions.width} height={dimensions.height} />
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-4xl text-center">
        <h1 className="text-3xl font-bold text-green-600">Başvuru Alındı!</h1>
        <p className="text-gray-700">
          Özel ders verebilmek için yaptığınız başvurunuz bize ulaştı. En kısa sürede bilgilerinizi değerlendirip sizinle iletişime geçeceğiz.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push("/")}
        >
          Anasayfa'ya Dön
        </Button>
      </div>
    </div>
  );
}
