import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log('🧪 Testing environment variables');
  
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  
  console.log('Environment check:', {
    hasYouTubeKey: !!youtubeApiKey,
    keyLength: youtubeApiKey?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    allYouTubeKeys: Object.keys(process.env).filter(key => key.includes('YOUTUBE'))
  });

  return NextResponse.json({
    hasYouTubeKey: !!youtubeApiKey,
    keyLength: youtubeApiKey?.length || 0,
    keyPreview: youtubeApiKey ? `${youtubeApiKey.substring(0, 10)}...` : 'NOT_FOUND',
    nodeEnv: process.env.NODE_ENV,
    allYouTubeKeys: Object.keys(process.env).filter(key => key.includes('YOUTUBE')),
    timestamp: new Date().toISOString()
  });
}