// Test script to verify Lambda CORS headers
// Run this after deploying your Lambda function

const https = require('https');

// Replace with your actual Lambda function URL
const LAMBDA_URL = process.argv[2] || 'YOUR_LAMBDA_FUNCTION_URL_HERE';

// Test video ID (Rick Astley - Never Gonna Give You Up)
const TEST_VIDEO_ID = 'dQw4w9WgXcQ';

// Construct the full URL with query parameters
const url = new URL(LAMBDA_URL);
url.searchParams.append('videoId', TEST_VIDEO_ID);
url.searchParams.append('lang', 'en');

console.log('Testing Lambda function CORS headers...');
console.log('URL:', url.toString());
console.log('');

// Make HTTP request and check headers
const req = https.get(url.toString(), (res) => {
  console.log('Response Status Code:', res.statusCode);
  console.log('Response Headers:');
  
  let corsOriginCount = 0;
  for (const header in res.headers) {
    if (header.toLowerCase() === 'access-control-allow-origin') {
      corsOriginCount++;
      console.log(`  ${header}: ${res.headers[header]}`);
    }
  }
  
  console.log('');
  if (corsOriginCount === 1) {
    console.log('✅ SUCCESS: Only one Access-Control-Allow-Origin header found');
  } else if (corsOriginCount === 0) {
    console.log('❌ ERROR: No Access-Control-Allow-Origin header found');
  } else {
    console.log(`❌ ERROR: ${corsOriginCount} Access-Control-Allow-Origin headers found (should be only 1)`);
  }
  
  console.log('');
  console.log('Full headers:');
  for (const header in res.headers) {
    console.log(`  ${header}: ${res.headers[header]}`);
  }
  
  // Collect response body
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('');
    console.log('Response Body Preview:');
    try {
      const jsonData = JSON.parse(data);
      console.log('  Video Title:', jsonData.videoTitle);
      console.log('  Language:', jsonData.language);
      console.log('  Transcript Lines:', jsonData.transcript ? jsonData.transcript.length : 0);
      console.log('  Is Automatic:', jsonData.isAutomatic);
    } catch (e) {
      console.log('  Raw response (first 200 chars):', data.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request Error:', e.message);
});

req.end();
