// Comprehensive Lambda Deployment Verification Script
// This script verifies that the Lambda function is properly deployed and working

const https = require('https');

// Configuration
const CONFIG = {
  // Replace with your actual Lambda function URL
  lambdaUrl: process.env.LAMBDA_URL || 'YOUR_LAMBDA_FUNCTION_URL_HERE',
  
  // Test video IDs
  testVideos: [
    { id: 'dQw4w9WgXcQ', description: 'Rick Astley - Never Gonna Give You Up (English)' },
    { id: 'M7lc1UVf-VE', description: 'YouTube Developers Live (English)' },
    { id: 'jNQXAC9IVRw', description: 'First YouTube video (English)' }
  ],
  
  // Test parameters
  testLang: 'en',
  timeout: 10000 // 10 seconds
};

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => chunks.push(chunk));
      
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Helper function to count CORS headers
function countCorsHeaders(headers) {
  let count = 0;
  let values = [];
  
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === 'access-control-allow-origin') {
      count++;
      values.push(value);
    }
  }
  
  return { count, values };
}

// Helper function to validate response structure
function validateResponseStructure(data) {
  try {
    const json = JSON.parse(data);
    
    const requiredFields = [
      'transcript',
      'language',
      'isAutomatic',
      'totalLines',
      'duration',
      'videoTitle'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in json));
    
    return {
      valid: missingFields.length === 0,
      missingFields,
      hasTranscript: Array.isArray(json.transcript),
      transcriptLines: json.transcript ? json.transcript.length : 0
    };
  } catch (e) {
    return {
      valid: false,
      error: 'Invalid JSON response',
      missingFields: [],
      hasTranscript: false,
      transcriptLines: 0
    };
  }
}

// Main verification function
async function verifyLambdaDeployment() {
  console.log(`${COLORS.cyan}🔍 Lambda Deployment Verification${COLORS.reset}`);
  console.log(`${COLORS.blue}=========================${COLORS.reset}\n`);
  
  if (CONFIG.lambdaUrl === 'YOUR_LAMBDA_FUNCTION_URL_HERE') {
    console.log(`${COLORS.yellow}⚠️  Please replace 'YOUR_LAMBDA_FUNCTION_URL_HERE' with your actual Lambda function URL${COLORS.reset}`);
    console.log(`${COLORS.yellow}   Or set the LAMBDA_URL environment variable${COLORS.reset}\n`);
    return;
  }
  
  console.log(`${COLORS.magenta}📍 Testing Lambda URL: ${CONFIG.lambdaUrl}${COLORS.reset}\n`);
  
  // Test each video
  for (const video of CONFIG.testVideos) {
    console.log(`${COLORS.cyan}🎬 Testing: ${video.description}${COLORS.reset}`);
    console.log(`${COLORS.blue}------------------------${COLORS.reset}`);
    
    try {
      // Construct URL with parameters
      const url = new URL(CONFIG.lambdaUrl);
      url.searchParams.append('videoId', video.id);
      url.searchParams.append('lang', CONFIG.testLang);
      
      // Make request
      const response = await makeRequest(url.toString());
      
      // Check status code
      console.log(`Status Code: ${response.statusCode}`);
      
      // Check CORS headers
      const corsInfo = countCorsHeaders(response.headers);
      if (corsInfo.count === 1) {
        console.log(`${COLORS.green}✅ CORS Headers: OK (1 header found)${COLORS.reset}`);
      } else if (corsInfo.count === 0) {
        console.log(`${COLORS.red}❌ CORS Headers: ERROR (No headers found)${COLORS.reset}`);
      } else {
        console.log(`${COLORS.red}❌ CORS Headers: ERROR (${corsInfo.count} headers found)${COLORS.reset}`);
        console.log(`   Values: ${corsInfo.values.join(', ')}`);
      }
      
      // Validate response structure
      const structureInfo = validateResponseStructure(response.body);
      if (structureInfo.valid) {
        console.log(`${COLORS.green}✅ Response Structure: OK${COLORS.reset}`);
        console.log(`   Transcript Lines: ${structureInfo.transcriptLines}`);
        console.log(`   Language: ${JSON.parse(response.body).language}`);
        console.log(`   Video Title: ${JSON.parse(response.body).videoTitle.substring(0, 50)}${JSON.parse(response.body).videoTitle.length > 50 ? '...' : ''}`);
      } else {
        console.log(`${COLORS.red}❌ Response Structure: ERROR${COLORS.reset}`);
        if (structureInfo.error) {
          console.log(`   ${structureInfo.error}`);
        }
        if (structureInfo.missingFields.length > 0) {
          console.log(`   Missing Fields: ${structureInfo.missingFields.join(', ')}`);
        }
      }
      
      console.log(''); // Empty line for spacing
      
    } catch (error) {
      console.log(`${COLORS.red}❌ Request Failed: ${error.message}${COLORS.reset}\n`);
    }
  }
  
  // Summary
  console.log(`${COLORS.cyan}📋 Verification Summary${COLORS.reset}`);
  console.log(`${COLORS.blue}=========================${COLORS.reset}`);
  console.log('After successful verification:');
  console.log('1. Update your .env.local file with the Lambda URL');
  console.log('2. Restart your Next.js development server');
  console.log('3. Test the SubScribe game at http://localhost:3000/games/SubScribe');
  console.log('');
  console.log('If you encounter issues:');
  console.log('- Check AWS CloudWatch logs for runtime errors');
  console.log('- Verify Lambda function timeout and memory settings');
  console.log('- Ensure your Lambda function has the yt-dlp binary');
}

// Run verification
verifyLambdaDeployment();
