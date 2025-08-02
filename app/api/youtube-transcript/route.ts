import { NextRequest, NextResponse } from "next/server";

const LAMBDA_URL = process.env.YOUTUBE_TRANSCRIPT_LAMBDA_URL;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Helper function to try YouTube Official API
async function tryYouTubeOfficialAPI(videoId: string, lang: string) {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  console.log('🎯 Trying YouTube Official API...');
  
  // Use relative URL for internal API calls
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://sukull.com' 
    : 'http://localhost:3000';
    
  const response = await fetch(`${baseUrl}/api/youtube-official?videoId=${videoId}&lang=${lang}`, {
    method: 'GET',
    signal: AbortSignal.timeout(30000) // 30 seconds
  });

  if (!response.ok) {
    throw new Error(`YouTube Official API returned ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

// Helper function to try AWS Lambda
async function tryAWSLambda(videoId: string, lang: string) {
  if (!LAMBDA_URL) {
    throw new Error('AWS Lambda URL not configured');
  }

  console.log('🎯 Trying AWS Lambda...');
  
  const response = await fetch(`${LAMBDA_URL}?videoId=${videoId}&lang=${lang}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(65000) // 65 seconds
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Lambda returned ${response.status}`);
  }

  return await response.json();
}

// Helper function to try simple fallback
async function trySimpleFallback(videoId: string, lang: string) {
  console.log('🎯 Trying simple fallback...');
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://sukull.com' 
    : 'http://localhost:3000';
    
  const response = await fetch(`${baseUrl}/api/youtube-simple?videoId=${videoId}&lang=${lang}`, {
    method: 'GET',
    signal: AbortSignal.timeout(20000) // 20 seconds
  });

  if (!response.ok) {
    throw new Error(`Simple fallback returned ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function GET(request: NextRequest) {
  console.log('🚀 YouTube Transcript API (Multi-Fallback) called');

  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const lang = searchParams.get('lang') || 'en';

  console.log(`📹 VideoId: ${videoId}, Lang: ${lang}`);

  if (!videoId) {
    console.log('❌ Missing videoId parameter');
    return NextResponse.json({
      error: "Missing videoId parameter."
    }, { status: 400 });
  }

  const methods = [
    { name: 'AWS Lambda', func: () => tryAWSLambda(videoId, lang) },
    { name: 'YouTube Official API', func: () => tryYouTubeOfficialAPI(videoId, lang) },
    { name: 'Simple Fallback', func: () => trySimpleFallback(videoId, lang) }
  ];

  let lastError = null;
  let attemptedMethods = [];

  // Try each method in order
  for (const method of methods) {
    try {
      console.log(`🔄 Attempting: ${method.name}`);
      attemptedMethods.push(method.name);
      
      const result = await method.func();
      
      console.log(`✅ Success with ${method.name}!`);
      
      // Add metadata about which method succeeded
      return NextResponse.json({
        ...result,
        source: method.name,
        attemptedMethods,
        videoId
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ ${method.name} failed: ${errorMessage}`);
      lastError = { method: method.name, error: errorMessage };
      
      // Continue to next method
      continue;
    }
  }

  // All methods failed
  console.error('❌ All transcript methods failed');

      return NextResponse.json({
    error: `All transcript methods failed. Last error: ${lastError?.error}`,
    videoId,
    type: "AllMethodsFailed",
    debug: {
      attemptedMethods,
      lastError,
      availableMethods: methods.map(m => m.name)
    }
    }, { status: 500 });
} 