"use client";

// Test configuration for SubScribe game debugging
export interface TestConfig {
  useLambda: boolean;
  testVideoId: string;
  debugMode: boolean;
  mockTranscript: boolean;
}

export const DEFAULT_TEST_CONFIG: TestConfig = {
  useLambda: false, // Set to false to use local API for testing
  testVideoId: "sbCvQbBi2G8", // The video ID you're testing with
  debugMode: true, // Enable detailed logging
  mockTranscript: false, // Set to true to use mock data
};

// Mock transcript data for testing when Lambda is down
export const MOCK_TRANSCRIPT_DATA = {
  transcript: [
    { startTime: 0, text: "This is a test transcript line 1" },
    { startTime: 3000, text: "This is a test transcript line 2" },
    { startTime: 6000, text: "This is a test transcript line 3" },
    { startTime: 9000, text: "This is a test transcript line 4" },
    { startTime: 12000, text: "This is a test transcript line 5" },
  ],
  duration: 15,
  title: "Test Video",
  videoId: "sbCvQbBi2G8"
};

// Debug logger
export const debugLog = (message: string, data?: unknown) => {
  if (DEFAULT_TEST_CONFIG.debugMode) {
    console.log(`[SubScribe Debug] ${message}`, data || '');
  }
};

// Test the Lambda function directly
export const testLambdaFunction = async (videoId: string) => {
  const lambdaUrl = process.env.NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL;
  if (!lambdaUrl) {
    debugLog("Lambda URL not configured");
    return null;
  }

  debugLog(`Testing Lambda function with URL: ${lambdaUrl}`);
  debugLog(`Video ID: ${videoId}`);

  try {
    const response = await fetch(`${lambdaUrl}?videoId=${videoId}&lang=en`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'omit',
    });

    debugLog(`Lambda response status: ${response.status}`);
    debugLog(`Lambda response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Lambda error response:`, errorText);
      return { error: `Lambda returned ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    debugLog(`Lambda response data:`, data);
    return data;
  } catch (error) {
    debugLog(`Lambda fetch error:`, error);
    return { error: `Lambda fetch failed: ${error}` };
  }
};

// Test the local API
export const testLocalApi = async (videoId: string) => {
  debugLog(`Testing local API with video ID: ${videoId}`);

  try {
    const response = await fetch(`/api/youtube-transcript?videoId=${videoId}&lang=en`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    debugLog(`Local API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Local API error response:`, errorText);
      return { error: `Local API returned ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    debugLog(`Local API response data:`, data);
    return data;
  } catch (error) {
    debugLog(`Local API fetch error:`, error);
    return { error: `Local API fetch failed: ${error}` };
  }
};
