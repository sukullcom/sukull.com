import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
  console.log('🚀 YouTube Duration API called');
  
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');

  console.log(`📹 VideoId: ${videoId}`);
  console.log(`🔑 API Key exists: ${!!YOUTUBE_API_KEY}`);

  if (!videoId) {
    console.log('❌ Missing videoId parameter');
    return NextResponse.json({ 
      error: "Missing videoId parameter." 
    }, { status: 400 });
  }

  if (!YOUTUBE_API_KEY) {
    console.log('❌ YouTube API key not configured');
    return NextResponse.json({ 
      error: "YouTube API key not configured. Please add YOUTUBE_API_KEY to environment variables.",
      videoId,
      needsConfiguration: true
    }, { status: 500 });
  }

  try {
    console.log(`Fetching video duration for: ${videoId}`);

    // Get video duration using YouTube Data API v3
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({
        error: `Video ${videoId} not found or is private.`,
        videoId,
        duration: null
      }, { status: 404 });
    }

    const durationISO = data.items[0].contentDetails.duration;
    const durationSeconds = parseDuration(durationISO);

    return NextResponse.json({
      videoId,
      duration: durationSeconds,
      durationISO,
      items: data.items // For compatibility with existing code
    });

  } catch (error) {
    console.error('❌ YouTube Duration API error:', error);
    
    return NextResponse.json({
      error: `Failed to get video duration: ${error.message}`,
      videoId,
      duration: null,
      debug: {
        hasApiKey: !!YOUTUBE_API_KEY,
        errorMessage: error.message
      }
    }, { status: 500 });
  }
}

// Parse YouTube's ISO 8601 duration format (PT1M30S -> 90 seconds)
function parseDuration(durationISO: string): number {
  const match = durationISO.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = match[1] ? parseInt(match[1]) * 3600 : 0;
  const minutes = match[2] ? parseInt(match[2]) * 60 : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  return hours + minutes + seconds;
}