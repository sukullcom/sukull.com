// YouTube Transcript API using ytdlp-nodejs for better reliability
import { NextRequest, NextResponse } from "next/server";
import { YtDlp } from "ytdlp-nodejs";
import { getServerUser } from "@/lib/auth";

interface TranscriptLine {
  startTime: number;
  text: string;
}

interface SubtitleFormat {
  ext: string;
  url: string;
}

interface Json3Event {
  segs?: { utf8?: string }[];
  tStartMs?: number;
}

interface Json3Data {
  events?: Json3Event[];
}

// List of common language codes to try as fallbacks
const FALLBACK_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt', 'ru', 'it', 'ar', 'tr'];

export async function GET(req: NextRequest) {
  // Add authentication check
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  const requestedLang = searchParams.get("lang") || "en"; // Default to English

  if (!videoId) {
    return NextResponse.json(
      { error: "Missing videoId parameter." },
      { status: 400 }
    );
  }

  console.log(`Fetching transcript for: ${videoId}, language: ${requestedLang}`);

  const ytdlp = new YtDlp();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // First, check if yt-dlp is available and download if needed
    const isInstalled = await ytdlp.checkInstallationAsync();
    if (!isInstalled) {
      console.log("Installing yt-dlp...");
    }

    // Get video info including available subtitles
    console.log("Fetching video information...");
    const videoInfo = await ytdlp.getInfoAsync(videoUrl);
    
    if (videoInfo._type !== 'video') {
      return NextResponse.json({
        error: "Invalid video. Please provide a single video URL.",
        videoId: videoId
      }, { status: 400 });
    }

    // Check for available subtitles
    const subtitles = videoInfo.subtitles || {};
    const automaticCaptions = videoInfo.automatic_captions || {};
    
    console.log("Available subtitles:", Object.keys(subtitles));
    console.log("Available auto-captions:", Object.keys(automaticCaptions));

    // Function to extract transcript from subtitle data
    const extractTranscript = async (lang: string, isAutomatic: boolean = false): Promise<TranscriptLine[] | null> => {
      try {
        const source = isAutomatic ? automaticCaptions : subtitles;
        const langSubs = source[lang];
        
        if (!langSubs || !Array.isArray(langSubs) || langSubs.length === 0) {
          return null;
        }

        const formats = ['json3', 'srv1', 'vtt', 'ttml'];
        let subtitle = null;

        for (const format of formats) {
          subtitle = langSubs.find((sub: SubtitleFormat) => sub.ext === format);
          if (subtitle) break;
        }

        if (!subtitle) subtitle = langSubs[0];

        console.log(`Fetching ${lang} ${isAutomatic ? 'auto' : 'manual'} (${subtitle.ext})`);

        // Fetch the subtitle content
        const response = await fetch(subtitle.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const content = await response.text();
        
        // Parse based on format
        let transcript: TranscriptLine[] = [];
        
        if (subtitle.ext === 'json3') {
          // Parse YouTube's json3 format
          const data = JSON.parse(content) as Json3Data;
          if (data.events) {
            transcript = data.events
              .filter((event: Json3Event) => event.segs && event.tStartMs !== undefined)
              .map((event: Json3Event) => ({
                startTime: (event.tStartMs || 0) / 1000, // Convert to seconds
                text: (event.segs || []).map((seg) => seg.utf8 || '').join(' ').trim()
              }))
              .filter((item: TranscriptLine) => item.text.length > 0);
          }
        } else if (subtitle.ext === 'vtt') {
          // Parse WebVTT format
          const lines = content.split('\n');
          let currentTime = 0;
          let currentText = '';
          
          for (const line of lines) {
            const timeMatch = line.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->/);
            if (timeMatch) {
              if (currentText.trim()) {
                transcript.push({
                  startTime: currentTime,
                  text: currentText.trim()
                });
              }
              const h = parseInt(timeMatch[1]);
              const m = parseInt(timeMatch[2]);
              const s = parseInt(timeMatch[3]);
              const ms = parseInt(timeMatch[4]);
              currentTime = h * 3600 + m * 60 + s + ms / 1000;
              currentText = '';
            } else if (line.trim() && !line.includes('WEBVTT') && !line.includes('-->')) {
              currentText += line.trim() + ' ';
            }
          }
          
          if (currentText.trim()) {
            transcript.push({
              startTime: currentTime,
              text: currentText.trim()
            });
          }
        } else {
          // For other formats, try to parse as basic text with timestamps
          console.log(`Attempting to parse ${subtitle.ext} format as plain text`);
          const lines = content.split('\n').filter(line => line.trim());
          transcript = lines.map((line, index) => ({
            startTime: index * 2, // Rough estimate
            text: line.trim()
          })).filter(item => item.text.length > 0);
        }

        // Clean up text
        transcript = transcript.map(item => ({
          ...item,
          text: item.text
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
        })).filter(item => item.text.length > 0);

        console.log(`Extracted ${transcript.length} lines from ${lang}`);
        return transcript;

      } catch (error) {
        console.error(`Error extracting ${lang}:`, error);
        return null;
      }
    };

    // Try to get transcript in the requested language (manual first, then automatic)
    let transcript: TranscriptLine[] | null = null;
    let usedLanguage = requestedLang;
    let isAutomatic = false;

    // Step 1: Try manual subtitles in requested language
    if (subtitles[requestedLang]) {
      transcript = await extractTranscript(requestedLang, false);
      if (transcript && transcript.length > 0) {
        console.log(`Found manual subtitles for ${requestedLang}`);
      }
    }

    // Step 2: Try automatic captions in requested language
    if (!transcript && automaticCaptions[requestedLang]) {
      transcript = await extractTranscript(requestedLang, true);
      if (transcript && transcript.length > 0) {
        isAutomatic = true;
        console.log(`Found automatic captions for ${requestedLang}`);
      }
    }

    // Step 3: Try fallback languages (manual first, then automatic)
    if (!transcript) {
      console.log("Trying fallback languages...");
      
      for (const lang of FALLBACK_LANGUAGES) {
        if (lang === requestedLang) continue; // Skip already tried language
        
        // Try manual subtitles
        if (subtitles[lang]) {
          transcript = await extractTranscript(lang, false);
          if (transcript && transcript.length > 0) {
            usedLanguage = lang;
            console.log(`Found manual subtitles for fallback language: ${lang}`);
            break;
          }
        }
        
        // Try automatic captions
        if (!transcript && automaticCaptions[lang]) {
          transcript = await extractTranscript(lang, true);
          if (transcript && transcript.length > 0) {
            usedLanguage = lang;
            isAutomatic = true;
            console.log(`Found automatic captions for fallback language: ${lang}`);
            break;
          }
        }
      }
    }

    // Step 4: Try any available language if still no transcript
    if (!transcript) {
      console.log("Trying any available language...");
      
      // Try any manual subtitles
      for (const lang of Object.keys(subtitles)) {
        transcript = await extractTranscript(lang, false);
        if (transcript && transcript.length > 0) {
          usedLanguage = lang;
          console.log(`Found manual subtitles for any language: ${lang}`);
          break;
        }
      }
      
      // Try any automatic captions
      if (!transcript) {
        for (const lang of Object.keys(automaticCaptions)) {
          transcript = await extractTranscript(lang, true);
          if (transcript && transcript.length > 0) {
            usedLanguage = lang;
            isAutomatic = true;
            console.log(`Found automatic captions for any language: ${lang}`);
            break;
          }
        }
      }
    }

    // If still no transcript found
    if (!transcript || transcript.length === 0) {
      const manual = Object.keys(subtitles);
      const auto = Object.keys(automaticCaptions);
      
      const errorMessage = `Bu video için transcript bulunamadı.\n\nMevcut:\n- Manuel: ${manual.length ? manual.join(', ') : 'Yok'}\n- Otomatik: ${auto.length ? auto.join(', ') : 'Yok'}`;

      return NextResponse.json({
        error: errorMessage,
        videoId: videoId,
        availableSubtitles: manual,
        availableAutoCaptions: auto
      }, { status: 404 });
    }

    console.log(`Successfully processed transcript: ${transcript.length} lines, language: ${usedLanguage}${isAutomatic ? ' (automatic)' : ''}`);

    return NextResponse.json({
      transcript,
      language: usedLanguage,
      isAutomatic,
      totalLines: transcript.length,
      duration: transcript.length > 0 ? transcript[transcript.length - 1].startTime : 0,
      videoTitle: videoInfo.title || 'Unknown'
    });

  } catch (error: unknown) {
    console.error("yt-dlp error:", error);

    if (error instanceof Error) {
      let message = `Hata: ${error.message}`;
      
      if (error.message.includes('Private video')) {
        message = 'Bu video özel. Lütfen halka açık bir video seçin.';
      } else if (error.message.includes('Video unavailable')) {
        message = 'Video erişilebilir değil.';
      }

      return NextResponse.json({
        error: message,
        type: "YtDlpError",
        videoId: videoId
      }, { status: 500 });
    }

    return NextResponse.json({
      error: "Bilinmeyen hata oluştu.",
      type: "UnknownError",
      videoId: videoId
    }, { status: 500 });
  }
} 