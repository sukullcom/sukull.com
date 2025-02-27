// pages/index.tsx

"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

function getVideoIdFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    // Handle both standard and short YouTube URLs
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

  // Predefined videos with thumbnails
  const predefinedVideos = [
    {
      title: "Slow Productivity (Cal Newport)",
      videoId: "0HMjTxKRbaI",
      thumbnail: "/mascot_purple.svg" // Upload this image manually
    },
    {
      title: "Never Gonna Give You Up",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/mascot_pink.svg" // Upload this image manually
    },
    {
      title: "Kurzgesagt - Immune System",
      videoId: "zQGOcOUBi6s",
      thumbnail: "/mascot_orange.svg" // Upload this image manually
    },
  ];

  async function getVideoDuration(videoId: string): Promise<number | null> {
    try {
      const apiKey = "AIzaSyDjvTdEKS2UQo-0mi8MAptcFGRsXiGzaAU"; // Replace with your YouTube API key
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`
      );
      const data = await response.json();
  
      if (data.items.length === 0) {
        return null;
      }
  
      const durationISO = data.items[0].contentDetails.duration;
      return parseDuration(durationISO);
    } catch (error) {
      console.error("Error fetching video duration:", error);
      return null;
    }
  }
  
  function parseDuration(durationISO: string): number {
    const match = durationISO.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
  
    const hours = match[1] ? parseInt(match[1]) * 3600 : 0;
    const minutes = match[2] ? parseInt(match[2]) * 60 : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
  
    return hours + minutes + seconds;
  }
  
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
  
    const duration = await getVideoDuration(videoId);
    if (duration === null) {
      alert("Bu video süre bilgisi alınamadı. Lütfen başka bir video seçin.");
      return;
    }
  
    if (duration > 360) { // 6 minutes = 360 seconds
      alert("Bu video süresi 6 dakikayı geçiyor. Lütfen başka bir video seçin.");
      return;
    }
  
    router.push(`/games/SubScribe/select-difficulty?videoId=${videoId}`);
  };
  

  const handleSelectPredefined = (videoId: string) => {
    router.push(`/games/SubScribe/select-difficulty?videoId=${videoId}`);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>
      <h1 className="text-xl font-bold">SubScribe</h1>
      <p className="py-4">En fazla 6 dk uzunluğunda istediğin bir Youtube videosunun bağlantısını girerek başla</p>
      <input
        type="text"
        placeholder="YouTube Video URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "20px" }}
      />
      <Button variant="primary" onClick={handleSelectUrl}>
        Oyuna Başla
      </Button>

      <hr style={{ margin: "40px 0" }} />

      <h2 className="py-4">Hazır bir video ile başla</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {predefinedVideos.map((v) => (
          <button
            key={v.videoId}
            onClick={() => handleSelectPredefined(v.videoId)}
            className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white text-left flex items-center gap-4 hover:bg-gray-100 transition-colors"
            style={{ cursor: "pointer" }}
          >
            <img
              src={v.thumbnail}
              alt={v.title}
              style={{
                width: "80px",
                height: "60px",
                objectFit: "cover",
                borderRadius: "8px"
              }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{v.title}</h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>Oyna</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
