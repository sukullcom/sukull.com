import { NextRequest, NextResponse } from "next/server";

const LAMBDA_URL = process.env.YOUTUBE_TRANSCRIPT_LAMBDA_URL;

export async function GET(request: NextRequest) {
  console.log('🚀 YouTube Transcript API (AWS Lambda) called');

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

  if (!LAMBDA_URL) {
    console.log('❌ AWS Lambda URL not configured');
    return NextResponse.json({
      error: "YouTube transcript service not configured. Please set YOUTUBE_TRANSCRIPT_LAMBDA_URL environment variable.",
      videoId,
      type: "ConfigurationError"
    }, { status: 500 });
  }

  try {
    console.log(`🔗 Calling AWS Lambda: ${LAMBDA_URL}?videoId=${videoId}&lang=${lang}`);
    
    const lambdaResponse = await fetch(`${LAMBDA_URL}?videoId=${videoId}&lang=${lang}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(65000) // 65 seconds (slightly more than Lambda timeout)
    });

    console.log(`📊 Lambda response status: ${lambdaResponse.status}`);

    if (!lambdaResponse.ok) {
      const errorData = await lambdaResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Lambda error response:', errorData);

      return NextResponse.json({
        error: errorData.error || `Lambda function returned ${lambdaResponse.status}`,
        videoId,
        type: "LambdaError",
        debug: {
          status: lambdaResponse.status,
          lambdaError: errorData
        }
      }, { status: lambdaResponse.status === 404 ? 404 : 500 });
    }

    const lambdaData = await lambdaResponse.json();
    console.log(`✅ Successfully got transcript with ${lambdaData.totalLines} lines`);

    return NextResponse.json(lambdaData);

  } catch (error: any) {
    console.error('❌ Error calling AWS Lambda:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({
        error: "Request timeout - video processing took too long",
        videoId,
        type: "TimeoutError"
      }, { status: 504 });
    }

    return NextResponse.json({
      error: `Failed to get transcript from AWS Lambda: ${error.message}`,
      videoId,
      type: "NetworkError",
      debug: {
        errorMessage: error.message,
        errorName: error.name
      }
    }, { status: 500 });
  }
} 