"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

export default function StudentSuccessPage() {
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  const finishAudio = typeof window !== "undefined" ? (
    <audio src="/sounds/success.mp3" autoPlay />
  ) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      {finishAudio}
      <Confetti width={dimensions.width} height={dimensions.height} />
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-4xl text-center">
        <h1 className="text-3xl font-bold text-green-600">Başvuru Alındı!</h1>
        <p className="text-gray-700">
          Özel ders talebiniz bize ulaştı. En kısa sürede sizinle iletişime
          geçeceğiz.
        </p>
        <Button variant="primary" size="lg" onClick={() => router.push("/private-lesson")}>
          Anasayfa&apos;ya Dön
        </Button>
      </div>
    </div>
  );
}
