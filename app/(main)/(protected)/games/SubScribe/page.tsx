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

  const handleSelectUrl = () => {
    if (!videoUrl) {
      alert("Please enter a valid YouTube URL.");
      return;
    }

    const videoId = getVideoIdFromUrl(videoUrl);
    if (!videoId) {
      alert("Invalid YouTube URL. Please provide a valid link.");
      return;
    }

    router.push(`/games/SubScribe/select-difficulty?videoId=${videoId}`);
  };

  const handleSelectPredefined = (videoId: string) => {
    router.push(`/games/SubScribe/select-difficulty?videoId=${videoId}`);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>
      <h1>Select a YouTube Video</h1>
      <p>You can enter a URL or choose one of the examples below.</p>
      <input
        type="text"
        placeholder="YouTube Video URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "20px" }}
      />
      <Button variant="primary" onClick={handleSelectUrl}>
        Use Entered URL
      </Button>

      <hr style={{ margin: "40px 0" }} />

      <h2>Or choose a predefined example:</h2>
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
              <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>Play the game</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
