import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const lang = searchParams.get('lang') || 'en';

  if (!videoId) {
    return NextResponse.json({ 
      error: "Missing videoId parameter." 
    }, { status: 400 });
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ 
      error: "YouTube API key not configured." 
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
    let selectedCaption = captionsData.items.find(item => 
      item.snippet.language === lang
    ) || captionsData.items.find(item => 
      item.snippet.language === 'en'
    ) || captionsData.items[0];

    if (!selectedCaption) {
      throw new Error('No suitable caption track found');
    }

    // Step 4: Download the caption content
    const captionDownloadResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions/${selectedCaption.id}?key=${YOUTUBE_API_KEY}&tfmt=srv1`
    );

    if (!captionDownloadResponse.ok) {
      throw new Error(`Caption download error: ${captionDownloadResponse.status}`);
    }

    const captionXml = await captionDownloadResponse.text();

    // Step 5: Parse the XML to extract transcript
    const transcript = parseYouTubeXML(captionXml);

    if (!transcript || transcript.length === 0) {
      throw new Error('Failed to parse caption content');
    }

    return NextResponse.json({
      transcript,
      language: selectedCaption.snippet.language,
      videoTitle,
      totalLines: transcript.length,
      source: 'youtube-official-api',
      isAutomatic: selectedCaption.snippet.trackKind === 'asr'
    });

  } catch (error) {
    console.error('YouTube Official API error:', error);
    
    return NextResponse.json({
      error: `Failed to get transcript: ${error.message}

Try these guaranteed working videos:
• Cal Newport - Slow Productivity: https://www.youtube.com/watch?v=0HMjTxKRbaI  
• Kurzgesagt - Immune System: https://www.youtube.com/watch?v=zQGOcOUBi6s
• Rick Astley - Never Gonna Give You Up: https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      videoId,
      type: "YouTubeAPIError"
    }, { status: 500 });
  }
}

// Parse YouTube's XML caption format
function parseYouTubeXML(xmlContent: string) {
  try {
    // Extract text segments with timing
    const textMatches = xmlContent.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    
    const transcript = textMatches.map((match, index) => {
      // Extract start time
      const startMatch = match.match(/start="([\d.]+)"/);
      const startTime = startMatch ? parseFloat(startMatch[1]) : index * 3;
      
      // Extract text content and clean it
      const text = match
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      
      return {
        startTime,
        text
      };
    }).filter(item => item.text.length > 0);

    return transcript;
  } catch (error) {
    console.error('XML parsing error:', error);
    return [];
  }
}