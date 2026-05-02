// pages/index.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ArrowLeft, CircleCheck, Music, BookOpen, Microscope, Lightbulb } from "lucide-react";
import Link from "next/link";

export default function VideoSelectionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const predefinedVideos = [
    {
      title: "Slow Productivity (Cal Newport)",
      videoId: "0HMjTxKRbaI",
      thumbnail: "/mascot_purple.svg"
    },
    {
      title: "Never Gonna Give You Up",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/mascot_pink.svg"
    },
    {
      title: "Kurzgesagt - Immune System",
      videoId: "zQGOcOUBi6s",
      thumbnail: "/mascot_orange.svg"
    },
  ];

  const handleSelectPredefined = (videoId: string) => {
    setIsLoading(true);
    setLoadingMessage("Zorluk seçimi sayfasına yönlendiriliyor...");
    router.push(`/games/SubScribe/select-difficulty?videoId=${videoId}`);
  };

  // Show loading spinner when checking video or navigating
  if (isLoading) {
    return (
      <div className="app-main-content-minh w-full flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground text-center max-w-md">
          {loadingMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 py-8 px-4">
      <Link
        href="/games"
        className="self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" /> Oyunlara Dön
      </Link>

      <h1 className="text-xl font-bold text-foreground">SubScribe</h1>
      <p className="mb-4 text-muted-foreground">
        Aşağıdaki videolardan birini seçerek başlayın. Her video özel olarak hazırlanmış yüksek kaliteli transcript&apos;lere sahiptir!
      </p>
      
      <div className="mb-6 p-4 bg-suk-brand-soft border border-suk-brand/30 rounded-lg">
        <h3 className="font-semibold text-suk-brand-soft-fg mb-2"><CircleCheck className="w-4 h-4 inline text-suk-brand" /> Mevcut Videolar</h3>
        <ul className="text-sm text-suk-brand-soft-fg space-y-1">
          <li>• <strong>Rick Astley - Never Gonna Give You Up</strong> - Klasik şarkı <Music className="w-4 h-4 inline text-suk-play" /></li>
          <li>• <strong>Slow Productivity (Cal Newport)</strong> - Eğitim videosu <BookOpen className="w-4 h-4 inline text-suk-payment" /></li>
          <li>• <strong>Kurzgesagt - Immune System</strong> - Bilim videosu <Microscope className="w-4 h-4 inline text-suk-brand" /></li>
        </ul>
        <p className="text-xs text-suk-brand mt-2">
          <Lightbulb className="w-4 h-4 inline text-suk-warning" /> %100 çalışma garantili ve tamamen ücretsiz!
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-3">Video Seç</h2>
      <p className="text-sm text-muted-foreground mb-4">
        <CircleCheck className="w-4 h-4 inline text-suk-brand" /> Bu videolar çalışma garantili, yüksek kaliteli transcript&apos;lere sahip ve <span className="font-semibold text-suk-brand">tamamen ücretsiz!</span>
      </p>
      <div className="flex flex-col gap-3">
        {predefinedVideos.map((v) => (
          <button
            key={v.videoId}
            onClick={() => handleSelectPredefined(v.videoId)}
            className="border-2 border-border rounded-xl p-4 bg-card text-left flex items-center gap-4 hover:border-suk-payment-ring hover:bg-suk-payment-soft/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <Image
              src={v.thumbnail}
              alt={v.title}
              width={80}
              height={60}
              className="object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">{v.title}</h3>
              <p className="text-sm text-muted-foreground">Oyna</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
