// Test script to check YouTube transcript availability
// Now using ytdlp-nodejs (much more reliable than previous packages)
// Run with: node scripts/test-transcript-api.js

const testVideos = [
  // Working videos (should have transcripts)
  {
    name: "Cal Newport - Slow Productivity",
    videoId: "0HMjTxKRbaI",
    expected: "success"
  },
  {
    name: "Never Gonna Give You Up", 
    videoId: "dQw4w9WgXcQ",
    expected: "success"
  },
  {
    name: "Kurzgesagt - Immune System",
    videoId: "zQGOcOUBi6s", 
    expected: "success"
  },
  // Turkish content test
  {
    name: "Turkish Educational Video",
    videoId: "9bZkp7q19f0", // Example Turkish video
    expected: "success"
  },
  // Test videos that commonly fail
  {
    name: "Music Video (likely no transcript)",
    videoId: "kJQP7kiw5Fk", // Despacito
    expected: "fail"
  },
  {
    name: "Invalid Video ID",
    videoId: "invalidvideoid123",
    expected: "fail"
  }
];

async function testTranscriptAPI() {
  console.log("🧪 Testing YouTube Transcript API (ytdlp-nodejs)...\n");
  
  const baseUrl = "http://localhost:3000/api/youtube-transcript";
  
  for (const video of testVideos) {
    console.log(`Testing: ${video.name} (${video.videoId})`);
    
    try {
      const response = await fetch(`${baseUrl}?videoId=${video.videoId}`, {
        headers: {
          'Cookie': 'your-auth-cookie-here' // You'll need to replace this with actual auth
        }
      });
      
      const data = await response.json();
      
      if (data.transcript && data.transcript.length > 0) {
        console.log(`✅ SUCCESS: Found ${data.transcript.length} transcript lines`);
        if (data.language) {
          console.log(`   Language: ${data.language}${data.isAutomatic ? ' (automatic)' : ' (manual)'}`);
        }
        if (data.duration) {
          console.log(`   Duration: ${Math.round(data.duration)} seconds`);
        }
        if (data.videoTitle) {
          console.log(`   Title: ${data.videoTitle}`);
        }
      } else if (data.error) {
        console.log(`❌ FAILED: ${data.error.split('\n')[0]}`);
        if (data.availableSubtitles?.length > 0) {
          console.log(`   Available manual: ${data.availableSubtitles.join(', ')}`);
        }
        if (data.availableAutoCaptions?.length > 0) {
          console.log(`   Available auto: ${data.availableAutoCaptions.join(', ')}`);
        }
      }
      
    } catch (error) {
      console.log(`💥 NETWORK ERROR: ${error.message}`);
    }
    
    console.log(""); // Empty line
  }
  
  console.log("🏁 Testing complete!");
}

// Instructions for manual testing
console.log(`
🔧 MANUAL TESTING INSTRUCTIONS:

1. Make sure your development server is running:
   npm run dev

2. Open your browser and go to:
   http://localhost:3000/games/SubScribe

3. Test these scenarios:

   ✅ SHOULD WORK (with ytdlp-nodejs):
   - https://www.youtube.com/watch?v=0HMjTxKRbaI (English educational)
   - https://www.youtube.com/watch?v=dQw4w9WgXcQ (Music with captions)
   - https://www.youtube.com/watch?v=zQGOcOUBi6s (Science content)
   - Most videos with either manual or automatic captions

   ❌ SHOULD FAIL GRACEFULLY:
   - https://www.youtube.com/watch?v=invalidid123 (invalid)
   - Private or unlisted videos
   - Videos with no captions at all (rare)

4. New Features with ytdlp-nodejs:
   - Much more reliable transcript extraction
   - Better format support (json3, vtt, srv1, ttml)
   - Automatic fallback to any available language
   - Clear indication of manual vs automatic captions
   - Detailed error messages with available subtitle info

5. Performance Notes:
   - First run may be slower (downloads yt-dlp binary)
   - Subsequent runs are much faster
   - More reliable than previous packages

Note: This implementation is much more robust and should work with most YouTube videos that have any form of captions.
`);

// Uncomment the line below to run the automated tests
// testTranscriptAPI(); 