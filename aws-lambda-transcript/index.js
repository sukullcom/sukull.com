// AWS Lambda Function for YouTube Transcript Extraction
// This solves Vercel's binary execution limitation by using AWS Lambda

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// List of common language codes to try as fallbacks
const FALLBACK_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt', 'ru', 'it', 'ar', 'tr'];

exports.handler = async (event) => {
  console.log('Lambda function started', JSON.stringify(event));
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Extract parameters
    const videoId = event.queryStringParameters?.videoId;
    const requestedLang = event.queryStringParameters?.lang || 'en';
    
    if (!videoId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Missing videoId parameter." 
        })
      };
    }

    console.log(`Processing: ${videoId}, language: ${requestedLang}`);

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Get video info and subtitles using yt-dlp
    const videoInfo = await getVideoInfo(videoUrl);
    
    if (!videoInfo || videoInfo._type !== 'video') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Invalid video. Please provide a single video URL.",
          videoId: videoId
        })
      };
    }

    // Extract transcript
    const result = await extractTranscript(videoInfo, requestedLang);
    
    if (!result.transcript || result.transcript.length === 0) {
      const manual = Object.keys(videoInfo.subtitles || {});
      const auto = Object.keys(videoInfo.automatic_captions || {});
      
      const errorMessage = `Bu video için transcript bulunamadı.\n\nMevcut:\n- Manuel: ${manual.length ? manual.join(', ') : 'Yok'}\n- Otomatik: ${auto.length ? auto.join(', ') : 'Yok'}`;

      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: errorMessage,
          videoId: videoId,
          availableSubtitles: manual,
          availableAutoCaptions: auto
        })
      };
    }

    console.log(`Success: ${result.transcript.length} lines, language: ${result.usedLanguage}${result.isAutomatic ? ' (automatic)' : ''}`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        transcript: result.transcript,
        language: result.usedLanguage,
        isAutomatic: result.isAutomatic,
        totalLines: result.transcript.length,
        duration: videoInfo.duration || (result.transcript.length > 0 ? result.transcript[result.transcript.length - 1].startTime : 0),
        videoTitle: videoInfo.title || 'Unknown'
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);

    let message = `Hata: ${error.message}`;
    
    if (error.message.includes('Private video')) {
      message = 'Bu video özel. Lütfen halka açık bir video seçin.';
    } else if (error.message.includes('Video unavailable')) {
      message = 'Video erişilebilir değil.';
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: message,
        type: "YtDlpError",
        videoId: event.queryStringParameters?.videoId
      })
    };
  }
};

// Get video information using yt-dlp
async function getVideoInfo(videoUrl) {
  return new Promise((resolve, reject) => {
    const ytdlpPath = '/tmp/yt-dlp'; // Lambda tmp directory
    
    const args = [
      '--dump-json',
      '--no-warnings',
      '--write-subs',
      '--write-auto-subs',
      '--sub-langs', 'all',
      '--skip-download',
      videoUrl
    ];

    console.log('Running yt-dlp:', args.join(' '));
    
    const process = spawn(ytdlpPath, args);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        try {
          const videoInfo = JSON.parse(stdout);
          resolve(videoInfo);
        } catch (parseError) {
          reject(new Error(`JSON parse error: ${parseError.message}`));
        }
      } else {
        reject(new Error(`yt-dlp failed: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Process error: ${error.message}`));
    });
  });
}

// Extract transcript from video info
async function extractTranscript(videoInfo, requestedLang) {
  const subtitles = videoInfo.subtitles || {};
  const automaticCaptions = videoInfo.automatic_captions || {};
  
  console.log("Available subtitles:", Object.keys(subtitles));
  console.log("Available auto-captions:", Object.keys(automaticCaptions));

  // Function to extract transcript from subtitle data
  const extractFromLang = async (lang, isAutomatic = false) => {
    try {
      const source = isAutomatic ? automaticCaptions : subtitles;
      const langSubs = source[lang];
      
      if (!langSubs || !Array.isArray(langSubs) || langSubs.length === 0) {
        return null;
      }

      const formats = ['json3', 'srv1', 'vtt', 'ttml'];
      let subtitle = null;

      for (const format of formats) {
        subtitle = langSubs.find(sub => sub.ext === format);
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
      let transcript = [];
      
      if (subtitle.ext === 'json3') {
        const data = JSON.parse(content);
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
  let transcript = null;
  let usedLanguage = null;
  let isAutomatic = false;

  // 1. Try requested language (manual first, then automatic)
  transcript = await extractFromLang(requestedLang, false);
  if (transcript) {
    usedLanguage = requestedLang;
    isAutomatic = false;
  } else {
    transcript = await extractFromLang(requestedLang, true);
    if (transcript) {
      usedLanguage = requestedLang;
      isAutomatic = true;
    }
  }

  // 2. Try fallback languages if requested language failed
  if (!transcript) {
    for (const fallbackLang of FALLBACK_LANGUAGES) {
      if (fallbackLang === requestedLang) continue; // Already tried

      transcript = await extractFromLang(fallbackLang, false);
      if (transcript) {
        usedLanguage = fallbackLang;
        isAutomatic = false;
        break;
      }

      transcript = await extractFromLang(fallbackLang, true);
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

      transcript = await extractFromLang(availableLang, false);
      if (transcript) {
        usedLanguage = availableLang;
        isAutomatic = false;
        break;
      }

      transcript = await extractFromLang(availableLang, true);
      if (transcript) {
        usedLanguage = availableLang;
        isAutomatic = true;
        break;
      }
    }
  }

  return { transcript, usedLanguage, isAutomatic };
}