// pages/index.tsx

"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { LoadingSpinner } from "@/components/loading-spinner";
import { InfinityIcon } from "lucide-react";

interface UserProgress {
  hearts: number;
  points: number;
  hasInfiniteHearts: boolean | null;
}

export default function VideoSelectionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

  // Predefined videos with thumbnails
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

  // Fetch user progress on component mount
  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        const response = await fetch('/api/user/progress', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        
        if (response.status === 401) {
          // Authentication expired, redirect to login
          window.location.href = '/login';
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          setUserProgress(data);
        }
      } catch (error) {
        console.error('Error fetching user progress:', error);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchUserProgress();
  }, []);

  const handleSelectPredefined = (videoId: string) => {
    setIsLoading(true);
    setLoadingMessage("Zorluk seçimi sayfasına yönlendiriliyor...");
    router.push(`/games/SubScribe/select-difficulty?videoId=${videoId}`);
  };

  // Show loading spinner when checking video or navigating
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground text-center max-w-md">
          {loadingMessage}
        </p>
      </div>
    );
  }

  // Show loading while fetching user progress
  if (progressLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground text-center max-w-md">
          Kullanıcı bilgileri yükleniyor...
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>
      {/* Hearts Display */}
      {userProgress && (
        <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg">
          <div className="flex items-center justify-center gap-3">
            <Image src="/heart.svg" alt="Hearts" width={24} height={24} />
            <span className="font-semibold text-rose-600">
              {userProgress.hasInfiniteHearts ? (
                <div className="flex items-center gap-2">
                  <InfinityIcon className="h-5 w-5" />
                  <span>Sınırsız Kalp</span>
                </div>
              ) : (
                `${userProgress.hearts}/5 Kalp`
              )}
            </span>
            {!userProgress.hasInfiniteHearts && userProgress.hearts === 0 && (
              <span className="text-sm text-rose-500 ml-2">
                (Özel video için kalp gerekli)
              </span>
            )}
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold mb-4">SubScribe</h1>
      <p className="mb-4 text-gray-700">
        Aşağıdaki videolardan birini seçerek başlayın. Her video özel olarak hazırlanmış yüksek kaliteli transcript&apos;lere sahiptir!
      </p>
      
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">✅ Mevcut Videolar</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Rick Astley - Never Gonna Give You Up</strong> - Klasik şarkı 🎵</li>
          <li>• <strong>Slow Productivity (Cal Newport)</strong> - Eğitim videosu 📚</li>
          <li>• <strong>Kurzgesagt - Immune System</strong> - Bilim videosu 🧬</li>
        </ul>
        <p className="text-xs text-green-600 mt-2">
          💡 %100 çalışma garantili ve tamamen ücretsiz!
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-3">Video Seç</h2>
      <p className="text-sm text-gray-600 mb-4">
        ✅ Bu videolar çalışma garantili, yüksek kaliteli transcript&apos;lere sahip ve <span className="font-semibold text-green-600">tamamen ücretsiz!</span>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {predefinedVideos.map((v) => (
          <button
            key={v.videoId}
            onClick={() => handleSelectPredefined(v.videoId)}
            className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white text-left flex items-center gap-4 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-green-200 hover:border-green-300"
            style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
            disabled={isLoading}
          >
            <Image
              src={v.thumbnail}
              alt={v.title}
              width={80}
              height={60}
              style={{
                objectFit: "cover",
                borderRadius: "8px"
              }}
            />
            <div className="flex-1">
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{v.title}</h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>Oyna</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-medium text-green-600">✅ Ücretsiz</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
