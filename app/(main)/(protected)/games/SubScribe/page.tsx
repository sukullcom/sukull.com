// pages/index.tsx

"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { LoadingSpinner } from "@/components/loading-spinner";
import { reduceHeartsForSubScribe } from "@/actions/user-progress";
import { InfinityIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getPredefinedTranscript, hasPredefinedTranscript } from "./predefined-transcripts";

interface UserProgress {
  hearts: number;
  points: number;
  hasInfiniteHearts: boolean | null;
}

function getVideoIdFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    // Handle both standard and short YouTube  URLs
    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.slice(1);
    }
    return parsedUrl.searchParams.get("v");
  } catch {
    return null;
  }
}

export default function VideoSelectionPage() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [testMode, setTestMode] = useState(false); // Toggle between Lambda and Local API
  const [debugMode, setDebugMode] = useState(false); // Show debug information

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

  // Removed YouTube API usage - duration now comes from ytdlp transcript response
  
  const handleSelectUrl = async () => {
    if (!videoUrl) {
      alert("Lütfen bir YouTube URL girin.");
      return;
    }
  
    const videoId = getVideoIdFromUrl(videoUrl);
    if (!videoId) {
      alert("Lütfen geçerli bir YouTube URL giriniz.");
      return;
    }

    // Check if this video has a predefined transcript
    if (!hasPredefinedTranscript(videoId)) {
      alert(`❌ Bu video desteklenmiyor!

Sadece aşağıdaki hazır videolar desteklenmektedir:
• Rick Astley - Never Gonna Give You Up
• Slow Productivity (Cal Newport)  
• Kurzgesagt - Immune System

Lütfen hazır videolardan birini seçin.`);
      return;
    }

    // Check hearts for custom videos (even predefined ones require hearts if entered manually)
    if (userProgress && !userProgress.hasInfiniteHearts && userProgress.hearts === 0) {
      alert("❤️ Kalbiniz kalmadı! Video oyunu için kalp gerekli.\n\n💰 Mağazadan kalp satın alabilirsiniz");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Video kontrol ediliyor...");

    try {
      // Get predefined transcript
      const transcriptData = getPredefinedTranscript(videoId);
      
      if (!transcriptData) {
        alert("Bu video için transcript bulunamadı. Lütfen hazır videoları kullanın.");
        return;
      }

      // Check video duration
      if (transcriptData.duration > 360) { // 6 minutes = 360 seconds
        alert("Bu video süresi 6 dakikayı geçiyor. Lütfen 6 dakikadan kısa bir video seçin.");
        return;
      }

      // Reduce hearts for video usage
      setLoadingMessage("Kalp düşürülüyor...");
      
      try {
        const heartResult = await reduceHeartsForSubScribe();
        if (heartResult.error === 'hearts') {
          alert("❤️ Kalbiniz kalmadı! Video oyunu için kalp gerekli.");
          return;
        }
        
        // Update local state
        if (heartResult.success && !heartResult.hasInfiniteHearts) {
          setUserProgress((prev: UserProgress | null) => prev ? {...prev, hearts: heartResult.hearts ?? prev.hearts} : null);
        }
        
        // Success! Video has transcript and heart deducted
        setLoadingMessage("Zorluk seçimi sayfasına yönlendiriliyor...");
        router.push(`/games/SubScribe/select-difficulty?videoId=${videoId}`);
      } catch (error) {
        console.error("Error reducing hearts:", error);
        alert("Kalp düşürülürken hata oluştu. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error("Error checking video:", error);
      alert("Video kontrol edilirken hata oluştu. Lütfen hazır videoları kullanın.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };
  

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

      <div className="flex items-center justify-between w-full">
        <h1 className="text-xl font-bold">SubScribe</h1>
      </div>
      <p className="py-4">Hazır videolardan birini seçerek başlayın. Her video özel olarak hazırlanmış transcript&apos;lere sahiptir!</p>
      
      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">✅ Desteklenen Videolar</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Rick Astley - Never Gonna Give You Up</strong> - Klasik şarkı</li>
          <li>• <strong>Slow Productivity (Cal Newport)</strong> - Eğitim videosu</li>
          <li>• <strong>Kurzgesagt - Immune System</strong> - Bilim videosu</li>
        </ul>
        <p className="text-xs text-green-600 mt-2">
          💡 Bu videolar yüksek kaliteli transcript&apos;lere sahip ve %100 çalışma garantisi verir
        </p>
      </div>

      {/* Advanced options for custom videos */}
      <div className="mb-4">
        <details className="bg-gray-50 border border-gray-200 rounded-lg">
          <summary className="p-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-100">
            🔧 İleri Düzey: Kendi Video URL&apos;inizi Deneyin
          </summary>
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-700">
                <strong>⚠️ Dikkat:</strong> Sadece yukarıdaki 3 video desteklenmektedir. 
                Başka videolar çalışmayacaktır.
              </p>
            </div>
            
            {(() => {
              const needsHeart = Boolean(userProgress && !userProgress.hasInfiniteHearts && userProgress.hearts === 0);
              const isDisabled = isLoading || needsHeart;
              
              return (
                <>
                  <input
                    type="text"
                    placeholder="YouTube Video URL (örn: https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
                    disabled={isDisabled}
                  />
                  <Button 
                    variant="secondary" 
                    onClick={handleSelectUrl} 
                    disabled={isDisabled}
                    className={needsHeart ? "opacity-50 cursor-not-allowed" : ""}
                    size="sm"
                  >
                    {needsHeart ? "Kalp Gerekli" : "Dene (-1 ❤️)"}
                  </Button>
                </>
              );
            })()}
          </div>
        </details>
      </div>

      <h2 className="py-4">Hazır bir video ile başla</h2>
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
