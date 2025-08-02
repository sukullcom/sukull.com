import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const lang = searchParams.get('lang') || 'en';

  if (!videoId) {
    return NextResponse.json({ 
      error: "Missing videoId parameter." 
    }, { status: 400 });
  }

  try {
    console.log(`Fetching transcript for: ${videoId}, language: ${lang}`);

    // Direct YouTube page fetch
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract player response
    const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/);
    if (!playerResponseMatch) {
      throw new Error('Could not find player response');
    }

    const playerResponse = JSON.parse(playerResponseMatch[1]);
    
    // Extract captions
    const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    
    if (captions.length === 0) {
      return NextResponse.json({
        error: `No captions found for video ${videoId}. Try one of these working videos:\n• Cal Newport: https://www.youtube.com/watch?v=0HMjTxKRbaI\n• Kurzgesagt: https://www.youtube.com/watch?v=zQGOcOUBi6s`,
        videoId
      }, { status: 404 });
    }

    // Get first available caption
    const caption = captions.find(c => c.languageCode === lang) || captions[0];
    
    if (!caption) {
      throw new Error('No suitable caption found');
    }

    // Fetch caption content
    const captionResponse = await fetch(caption.baseUrl);
    if (!captionResponse.ok) {
      throw new Error(`Failed to fetch captions: HTTP ${captionResponse.status}`);
    }

    const xmlContent = await captionResponse.text();
    
    // Simple XML parsing
    const textMatches = xmlContent.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    const transcript = textMatches.map((match, index) => {
      const text = match.replace(/<[^>]*>/g, '').trim();
      const startMatch = match.match(/start="([\d.]+)"/);
      const startTime = startMatch ? parseFloat(startMatch[1]) : index * 3;
      
      return {
        startTime,
        text: text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      };
    }).filter(item => item.text.length > 0);

    return NextResponse.json({
      transcript,
      language: caption.languageCode || lang,
      totalLines: transcript.length,
      videoTitle: playerResponse?.videoDetails?.title || 'Unknown',
      source: 'vercel-direct'
    });

  } catch (error) {
    console.error('Transcript error:', error);
    
    return NextResponse.json({
      error: `Could not fetch transcript: ${error.message}\n\nTry these working videos instead:\n• Cal Newport: https://www.youtube.com/watch?v=0HMjTxKRbaI\n• Kurzgesagt: https://www.youtube.com/watch?v=zQGOcOUBi6s\n• Rick Astley: https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      videoId,
      type: "TranscriptError"
    }, { status: 500 });
  }
}