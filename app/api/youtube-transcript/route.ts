// pages/api/youtube-transcript/route.ts

import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript, TranscriptResponse, YoutubeTranscriptError } from "youtube-transcript";
import { getServerUser } from "@/lib/auth";

interface TranscriptLine {
  startTime: number;
  text: string;
}

export async function GET(req: NextRequest) {
  // Add authentication check
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  const lang = searchParams.get("lang") || "en"; // Default to English

  if (!videoId) {
    return NextResponse.json(
      { error: "Missing videoId parameter." },
      { status: 400 }
    );
  }

  try {
    // Fetch the transcript using YoutubeTranscript class with specified language
    const transcriptData: TranscriptResponse[] = await YoutubeTranscript.fetchTranscript(videoId, { lang });

    if (!transcriptData || transcriptData.length === 0) {
      return NextResponse.json(
        { error: `No transcript available in '${lang}' for this video.` },
        { status: 404 }
      );
    }

    // Transform transcript data to desired format
    const transcript: TranscriptLine[] = transcriptData.map((entry) => ({
      startTime: entry.offset,
      text: entry.text,
    }));

    return NextResponse.json({ transcript });
  } catch (error: unknown) {
    console.error("Error fetching transcript:", error);

    // Handle specific errors thrown by youtube-transcript
    if (error instanceof YoutubeTranscriptError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof Error) {
      // Handle other types of errors
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
  }
}
