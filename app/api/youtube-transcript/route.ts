// YouTube Transcript API using ytdlp-nodejs for better reliability
// This is a temporary fallback - the main implementation should be on Railway server
import { NextRequest, NextResponse } from "next/server";
import { YtDlp } from "ytdlp-nodejs";
import { getServerUser } from "@/lib/auth";

interface TranscriptLine {
  startTime: number;
  duration?: number;
  text: string;
}

interface SubtitleFormat {
  url: string;
  ext: string;
}

interface Json3Event {
  tStartMs: number;
  dDurationMs: number;
  segs?: Array<{
    utf8: string;
  }>;
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
          const data: Json3Data = JSON.parse(content);
          if (data.events) {
            for (const event of data.events) {
              if (event.segs) {
                let text = '';
                for (const seg of event.segs) {
                  if (seg.utf8) {
                    text += seg.utf8;
                  }
                }
                if (text.trim()) {
                  transcript.push({
                    startTime: event.tStartMs / 1000,
                    duration: event.dDurationMs / 1000,
                    text: text.trim()
                  });
                }
              }
            }
          }
        } else if (subtitle.ext === 'vtt') {
          const lines = content.split('\n');
          let currentTime = null;
          let currentText = '';
          
          
          for (const line of lines) {
            const timeMatch = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
            if (timeMatch) {
              if (currentTime && currentText.trim()) {
                transcript.push({
                  startTime: currentTime,
                  text: currentText.trim()
                });
              }
              // Convert time to seconds
              const [, start] = timeMatch;
              const [hours, minutes, seconds] = start.split(':');
              currentTime = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
              currentText = '';
            } else if (line.trim() && !line.startsWith('WEBVTT') && !line.includes('-->')) {
              currentText += line + ' ';
            }
          }
          
          if (currentTime && currentText.trim()) {
            transcript.push({
              startTime: currentTime,
              text: currentText.trim()
            });
          }
        }

        return transcript.length > 0 ? transcript : null;
      } catch (error) {
        console.error(`Error extracting ${lang} transcript:`, error);
        return null;
      }
    };

    // Try to get transcript in order of preference
    let transcript: TranscriptLine[] | null = null;
    let usedLanguage: string | null = null;
    let isAutomatic = false;

    // 1. Try requested language (manual first, then automatic)
    transcript = await extractTranscript(requestedLang, false);
    if (transcript) {
      usedLanguage = requestedLang;
      isAutomatic = false;
    } else {
      transcript = await extractTranscript(requestedLang, true);
      if (transcript) {
        usedLanguage = requestedLang;
        isAutomatic = true;
      }
    }

    // 2. Try fallback languages if requested language failed
    if (!transcript) {
      for (const fallbackLang of FALLBACK_LANGUAGES) {
        if (fallbackLang === requestedLang) continue; // Already tried

        transcript = await extractTranscript(fallbackLang, false);
        if (transcript) {
          usedLanguage = fallbackLang;
          isAutomatic = false;
          break;
        }

        transcript = await extractTranscript(fallbackLang, true);
        if (transcript) {
          usedLanguage = fallbackLang;
          isAutomatic = true;
          break;
        }
      }
    }

    // 3. Try any available language as last resort
    if (!transcript) {
      const allLanguages = [...Object.keys(subtitles), ...Object.keys(automaticCaptions)];
      for (const availableLang of allLanguages) {
        if (FALLBACK_LANGUAGES.includes(availableLang)) continue; // Already tried

        transcript = await extractTranscript(availableLang, false);
        if (transcript) {
          usedLanguage = availableLang;
          isAutomatic = false;
          break;
        }

        transcript = await extractTranscript(availableLang, true);
        if (transcript) {
          usedLanguage = availableLang;
          isAutomatic = true;
          break;
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