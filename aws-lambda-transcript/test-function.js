// Test script for the deployed Lambda function
// Usage: node test-function.js <function-url>

const https = require('https');
const url = require('url');

// Test video IDs
const testVideos = [
  { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
  { id: '0HMjTxKRbaI', title: 'Slow Productivity (Cal Newport)' },
  { id: 'zQGOcOUBi6s', title: 'Kurzgesagt - Immune System' }
];

function testFunction(functionUrl, videoId, expectedTitle) {
  return new Promise((resolve, reject) => {
    const testUrl = `${functionUrl}?videoId=${videoId}&lang=en`;
    console.log(`🧪 Testing: ${testUrl}`);
    
    const startTime = Date.now();
    
    const request = https.get(testUrl, (response) => {
      let data = '';
      
      response.on('data', chunk => {
        data += chunk;
      });
      
      response.on('end', () => {
        const duration = Date.now() - startTime;
        
        try {
          const result = JSON.parse(data);
          
          if (response.statusCode === 200) {
            console.log(`✅ Success (${duration}ms):`);
            console.log(`   📺 Title: ${result.videoTitle}`);
            console.log(`   🎵 Lines: ${result.totalLines}`);
            console.log(`   ⏱️  Duration: ${Math.round(result.duration)}s`);
            console.log(`   🌍 Language: ${result.language} ${result.isAutomatic ? '(auto)' : '(manual)'}`);
            resolve(true);
          } else {
            console.log(`❌ Error (${response.statusCode}): ${result.error}`);
            resolve(false);
          }
        } catch (error) {
          console.log(`❌ Parse error: ${error.message}`);
          console.log(`   Raw response: ${data.substring(0, 200)}...`);
          resolve(false);
        }
      });
    });
    
    request.on('error', (error) => {
      console.log(`❌ Request error: ${error.message}`);
      resolve(false);
    });
    
    request.setTimeout(30000, () => {
      console.log(`❌ Timeout (30s)`);
      request.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  const functionUrl = process.argv[2];
  
  if (!functionUrl) {
    console.log('❌ Please provide the Lambda function URL');
    console.log('Usage: node test-function.js <function-url>');
    console.log('Example: node test-function.js https://abcd1234.lambda-url.us-east-1.on.aws/');
    process.exit(1);
  }
  
  console.log('🚀 Testing AWS Lambda YouTube Transcript Function');
  console.log(`📍 Function URL: ${functionUrl}`);
  console.log('');
  
  let passed = 0;
  let total = testVideos.length;
  
  for (const video of testVideos) {
    const success = await testFunction(functionUrl, video.id, video.title);
    if (success) passed++;
    console.log('');
  }
  
  console.log(`📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your Lambda function is working correctly.');
    console.log('');
    console.log('🔧 Next steps:');
    console.log(`1. Add to your .env.local: NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL=${functionUrl}`);
    console.log('2. Deploy your app to Vercel');
    console.log('3. Test your SubScribe game in production');
  } else {
    console.log('⚠️  Some tests failed. Check the function configuration.');
    process.exit(1);
  }
}

runTests().catch(console.error);