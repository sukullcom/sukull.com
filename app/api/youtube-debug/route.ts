import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
  console.log('🐛 YouTube Debug API called');
  
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId') || 'BGqkY-i0ZHU';

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  try {
    console.log(`Testing with video: ${videoId}`);

    // Step 1: Get video info
    console.log('Step 1: Getting video info...');
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    console.log(`Video API response: ${videoResponse.status}`);
    
    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.log('Video API error:', errorText);
      return NextResponse.json({
        step: 'video-info',
        error: `Video API error: ${videoResponse.status}`,
        details: errorText
      }, { status: 500 });
    }

    const videoData = await videoResponse.json();
    console.log('Video data received, items:', videoData.items?.length || 0);

    // Step 2: Get captions list
    console.log('Step 2: Getting captions list...');
    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    console.log(`Captions API response: ${captionsResponse.status}`);

    if (!captionsResponse.ok) {
      const errorText = await captionsResponse.text();
      console.log('Captions API error:', errorText);
      return NextResponse.json({
        step: 'captions-list',
        error: `Captions API error: ${captionsResponse.status}`,
        details: errorText,
        videoTitle: videoData.items?.[0]?.snippet?.title
      }, { status: 500 });
    }

    const captionsData = await captionsResponse.json();
    console.log('Captions data received, items:', captionsData.items?.length || 0);

    return NextResponse.json({
      success: true,
      videoTitle: videoData.items?.[0]?.snippet?.title,
      videoId,
      captionsCount: captionsData.items?.length || 0,
      captions: captionsData.items?.map(item => ({
        id: item.id,
        language: item.snippet.language,
        trackKind: item.snippet.trackKind
      })) || []
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}