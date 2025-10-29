"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { decode } from "html-entities";
import VideoPlayer from "@/components/video-player";
import LyricsGame from "../lyrics-game";
import { LoadingSpinner } from "@/components/loading-spinner";
import { CompletionModal } from "@/components/modals/completion-modal";
import { getPredefinedTranscript } from "../predefined-transcripts";

interface TranscriptLine {
  startTime: number;
  text: string;
}

interface LyricWord {
  word: string;
  missing: boolean;
}

interface LyricLine {
  startTime: number;
  words: LyricWord[];
}

// Removed old predefined transcripts - now using structured predefined-transcripts.ts

function generateLyricsLines(transcript: TranscriptLine[], ratio: number): LyricLine[] {
  const totalLines = transcript.length;

  let multiplier = 1.5;
  if (ratio === 0.5) {
    multiplier = 2.5;
  } else if (ratio === 0.75) {
    multiplier = 3.5;
  } else if (ratio === 1.0) {
    multiplier = 5;
  } else if (ratio === 0.25) {
    multiplier = 1.5;
  }

  const totalMissingWords = Math.round(totalLines * ratio * multiplier);

  // Split transcript into words - ensure we don't create duplicates
  const linesWords = transcript.map((line) => {
    // Clean the text and split by whitespace, filter out empty strings
    const cleanedText = line.text.trim();
    return cleanedText.split(/\s+/).filter(word => word.length > 0);
  });

  interface Candidate {
    lineIndex: number;
    wordIndex: number;
  }

  const candidates: Candidate[] = [];
  linesWords.forEach((words, lineIndex) => {
    words.forEach((word, wordIndex) => {
      // Only include words that contain only letters (no punctuation, numbers)
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (cleanWord.length > 0 && /^[a-zA-Z]+$/.test(cleanWord)) {
        candidates.push({ lineIndex, wordIndex });
      }
    });
  });

  // Shuffle candidates randomly
  candidates.sort(() => Math.random() - 0.5);

  // Select required number of missing words (ensure we don't exceed available candidates)
  const chosen = candidates.slice(0, Math.min(totalMissingWords, candidates.length));

  // Create lyric lines with proper word structure
  const lyricLines: LyricLine[] = transcript.map((transcriptLine, lineIndex) => {
    const words = linesWords[lineIndex].map((word) => ({
      word: word,
      missing: false
    }));
    
    return {
      startTime: transcriptLine.startTime,
      words: words
    };
  });

  // Mark chosen words as missing
  for (const candidate of chosen) {
    const lineIndex = candidate.lineIndex;
    const wordIndex = candidate.wordIndex;
    
    if (lyricLines[lineIndex] && lyricLines[lineIndex].words[wordIndex]) {
      lyricLines[lineIndex].words[wordIndex].missing = true;
    }
  }

  return lyricLines;
}

export default function GamePage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId");
  const ratio = parseFloat(searchParams.get("ratio") || "0.5");
  const difficulty = searchParams.get("difficulty") || "Orta";
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lyricsGenerated, setLyricsGenerated] = useState(false);

  const generateNewLyrics = (trans: TranscriptLine[], r: number) => {
    const newLyrics = generateLyricsLines(trans, r);
    setLyrics(newLyrics);
    setLyricsGenerated(true);
  };

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!videoId) {
        setLoading(false);
        setError("Geçersiz video ID.");
        return;
      }

      // Use predefined transcript if available
      const predefinedData = getPredefinedTranscript(videoId);
      if (predefinedData) {
        const decodedTranscript = predefinedData.transcript.map((line) => ({
          startTime: line.startTime,
          text: decode(line.text),
        }));
        setTranscript(decodedTranscript);
        setLoading(false);
        return;
      }

      // If no predefined transcript, show error
      setError(`❌ Bu video desteklenmiyor!

Sadece aşağıdaki hazır videolar desteklenmektedir:
• Rick Astley - Never Gonna Give You Up
• Slow Productivity (Cal Newport)  
• Kurzgesagt - Immune System

Lütfen ana sayfaya dönüp hazır videolardan birini seçin.`);
        setLoading(false);
    };

    fetchTranscript();
  }, [videoId]);

  // Only generate lyrics once when transcript is first loaded
  useEffect(() => {
    if (transcript.length > 0 && !lyricsGenerated) {
      generateNewLyrics(transcript, ratio);
    }
  }, [transcript, ratio, lyricsGenerated]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground text-center max-w-md">
          Transcript yükleniyor ve oyun hazırlanıyor...
        </p>
      </div>
    );
  }
  if (error && !transcript.length) return <p>{error}</p>;
  if (!transcript.length) return <p>No transcript available for this video.</p>;

  return (
    <div className="game-page" style={{maxWidth: "750px", margin: "auto" }}>
      {videoId && <VideoPlayer videoId={videoId} />}
      {error && <p className="error-message">{error}</p>}
      <LyricsGame lyrics={lyrics} difficulty={difficulty as "Kolay" | "Orta" | "Zor"} />
      <CompletionModal />
    </div>
  );
}