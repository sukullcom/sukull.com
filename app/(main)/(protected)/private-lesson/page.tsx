"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function PrivateLessonPage() {
  const router = useRouter();

  const handleOptionClick = (option: string) => {
    if (option === "get") {
      router.push("/private-lesson/get");
    } else if (option === "give") {
      router.push("/private-lesson/give");
    } else if (option === "group") {
      router.push("/private-lesson/group");
    }
  };

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
