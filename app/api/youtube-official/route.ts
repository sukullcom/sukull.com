import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubeCaptionItem {
  id: string;
  snippet: {
    language: string;
    trackKind: string;
  };
}

export async function GET(request: NextRequest) {
  console.log('🚀 YouTube Official API called');
  
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const lang = searchParams.get('lang') || 'en';

  console.log(`📹 VideoId: ${videoId}, Lang: ${lang}`);
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
      error: `YouTube API key not configured. Please add YOUTUBE_API_KEY to environment variables.
      
For testing, try these videos with guaranteed transcripts:
• Cal Newport - Slow Productivity: https://www.youtube.com/watch?v=0HMjTxKRbaI
• Kurzgesagt - Immune System: https://www.youtube.com/watch?v=zQGOcOUBi6s
• Rick Astley - Never Gonna Give You Up: https://www.youtube.com/watch?v=dQw4w9WgXcQ

Steps to fix:
1. Go to: https://vercel.com/sukullcoms-projects/sukull-com/settings/environment-variables
2. Add: YOUTUBE_API_KEY = [your API key]
3. Redeploy: vercel --prod`,
      videoId,
      needsConfiguration: true,
      debug: {
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('YOUTUBE')),
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }

  try {
    console.log(`Fetching official YouTube transcript for: ${videoId}, language: ${lang}`);

    // Step 1: Get video info and caption tracks
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!videoResponse.ok) {
      throw new Error(`YouTube API error: ${videoResponse.status}`);
    }

    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      return NextResponse.json({
        error: `Video ${videoId} not found or is private.`,
        videoId
      }, { status: 404 });
    }

    const videoTitle = videoData.items[0].snippet.title;

    // Step 2: Get available captions
    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!captionsResponse.ok) {
      throw new Error(`Captions API error: ${captionsResponse.status}`);
    }

    const captionsData = await captionsResponse.json();

    if (!captionsData.items || captionsData.items.length === 0) {
      return NextResponse.json({
        error: `No captions available for video "${videoTitle}".
        
Try one of these videos with guaranteed transcripts:
• Cal Newport - Slow Productivity: https://www.youtube.com/watch?v=0HMjTxKRbaI
• Kurzgesagt - Immune System: https://www.youtube.com/watch?v=zQGOcOUBi6s
• Rick Astley - Never Gonna Give You Up: https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
        videoId,
        videoTitle
      }, { status: 404 });
    }

    // Step 3: Find best caption track
    const selectedCaption = captionsData.items.find((item: YouTubeCaptionItem) => 
      item.snippet.language === lang
    ) || captionsData.items.find((item: YouTubeCaptionItem) => 
      item.snippet.language === 'en'
    ) || captionsData.items[0];

    if (!selectedCaption) {
      throw new Error('No suitable caption track found');
    }
    
 
    // Note: Caption download requires OAuth 2.0, which we can't do with just API key
    // Instead, we'll return info about available captions and suggest predefined videos
    
    console.log(`Found ${captionsData.items.length} caption tracks for video "${videoTitle}"`);
    
    // Check if this is one of our predefined videos
    const predefinedVideos: Record<string, string> = {
      'BGqkY-i0ZHU': 'Cal Newport video',
      'zQGOcOUBi6s': 'Kurzgesagt video', 
      'dQw4w9WgXcQ': 'Rick Astley video',
      '0HMjTxKRbaI': 'Cal Newport Slow Productivity'
    };
    
    if (predefinedVideos[videoId]) {
      return NextResponse.json({
        error: `Captions found but download requires OAuth. Use predefined transcript instead.`,
        videoId,
        videoTitle,
        captionsAvailable: captionsData.items.length,
        availableLanguages: captionsData.items.map((item: YouTubeCaptionItem) => item.snippet.language),
        suggestion: `This video (${predefinedVideos[videoId]}) has a predefined transcript available. The game will use the built-in transcript automatically.`,
        usePredefined: true
      }, { status: 200 });
    }
    
    // For non-predefined videos, explain the limitation
    return NextResponse.json({
      error: `Found ${captionsData.items.length} caption(s) but YouTube requires OAuth 2.0 for caption download, which isn't supported with API keys.
      
Try one of these videos with guaranteed transcripts:
• Cal Newport - Slow Productivity: https://www.youtube.com/watch?v=0HMjTxKRbaI
• Kurzgesagt - Immune System: https://www.youtube.com/watch?v=zQGOcOUBi6s
• Rick Astley - Never Gonna Give You Up: https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      videoId,
      videoTitle,
      captionsAvailable: captionsData.items.length,
      availableLanguages: captionsData.items.map((item: YouTubeCaptionItem) => item.snippet.language),
      requiresOAuth: true
    }, { status: 422 }); // 422 Unprocessable Entity

  } catch (error: unknown) {
    console.error('❌ YouTube Official API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const errorStack = error instanceof Error ? error.stack?.substring(0, 500) : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      name: errorName,
      stack: errorStack
    });
    
    return NextResponse.json({
      error: `Failed to get transcript: ${errorMessage}

Try these guaranteed working videos:
• Cal Newport - Slow Productivity: https://www.youtube.com/watch?v=0HMjTxKRbaI  
• Kurzgesagt - Immune System: https://www.youtube.com/watch?v=zQGOcOUBi6s
• Rick Astley - Never Gonna Give You Up: https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      videoId,
      type: "YouTubeAPIError",
      debug: {
        hasApiKey: !!YOUTUBE_API_KEY,
        errorType: errorName,
        errorMessage: errorMessage
      }
    }, { status: 500 });
  }
}

