import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing YouTube API connection...');
    console.log(`🔑 API Key exists: ${!!YOUTUBE_API_KEY}`);
    console.log(`🔑 API Key length: ${YOUTUBE_API_KEY?.length || 0}`);
    
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ 
        error: "No API key found",
        debug: { 
          env: process.env.NODE_ENV,
          hasKey: false 
        }
      }, { status: 500 });
    }

    // Simple test: get video info for a known video
    const videoId = 'BGqkY-i0ZHU';
    const testUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    console.log('🌐 Making test request to YouTube API...');
    
    const response = await fetch(testUrl);
    console.log(`📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ YouTube API error: ${errorText}`);
      return NextResponse.json({
        error: `YouTube API returned ${response.status}`,
        details: errorText,
        debug: {
          url: testUrl.replace(YOUTUBE_API_KEY, '[HIDDEN]'),
          status: response.status
        }
      }, { status: 500 });
    }

    const data = await response.json();
    console.log(`✅ Success! Got video data`);
    
    return NextResponse.json({
      success: true,
      message: "YouTube API is working!",
      videoTitle: data.items?.[0]?.snippet?.title || 'Unknown',
      debug: {
        hasApiKey: true,
        apiKeyLength: YOUTUBE_API_KEY.length,
        itemsCount: data.items?.length || 0
      }
    });

  } catch (error) {
    console.error('🚨 Test error:', error);
    return NextResponse.json({
      error: error.message,
      debug: {
        errorType: error.constructor.name,
        hasApiKey: !!YOUTUBE_API_KEY
      }
    }, { status: 500 });
  }
}