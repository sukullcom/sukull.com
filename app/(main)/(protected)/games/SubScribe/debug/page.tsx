"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DEFAULT_TEST_CONFIG, 
  debugLog, 
  testLambdaFunction, 
  testLocalApi, 
  MOCK_TRANSCRIPT_DATA 
} from "../test-config";

export default function SubScribeDebugPage() {
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=sbCvQbBi2G8&t=7s");
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testType, setTestType] = useState<'lambda' | 'local' | 'both'>('both');

  const extractVideoId = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname === "youtu.be") {
        return parsedUrl.pathname.slice(1);
      }
      return parsedUrl.searchParams.get("v");
    } catch {
      return null;
    }
  };

  const runTests = async () => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setTestResults({ error: "Invalid YouTube URL" });
      return;
    }

    setIsLoading(true);
    setTestResults(null);

    const results: any = {
      videoId,
      videoUrl,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      if (testType === 'lambda' || testType === 'both') {
        debugLog("Testing Lambda function...");
        results.tests.lambda = await testLambdaFunction(videoId);
      }

      if (testType === 'local' || testType === 'both') {
        debugLog("Testing local API...");
        results.tests.local = await testLocalApi(videoId);
      }

      // Add environment info
      results.environment = {
        lambdaUrl: process.env.NEXT_PUBLIC_LAMBDA_TRANSCRIPT_URL,
        userAgent: navigator.userAgent,
        origin: window.location.origin,
      };

      setTestResults(results);
    } catch (error) {
      setTestResults({ error: `Test execution failed: ${error}` });
    } finally {
      setIsLoading(false);
    }
  };

  const testMockData = () => {
    setTestResults({
      videoId: DEFAULT_TEST_CONFIG.testVideoId,
      videoUrl,
      timestamp: new Date().toISOString(),
      tests: {
        mock: MOCK_TRANSCRIPT_DATA
      }
    });
  };

  const getStatusBadge = (result: any) => {
    if (!result) return <Badge variant="secondary">Not tested</Badge>;
    if (result.error) return <Badge variant="destructive">Error</Badge>;
    if (result.transcript && result.transcript.length > 0) return <Badge variant="default">Success</Badge>;
    return <Badge variant="outline">No transcript</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SubScribe Debug Tool</h1>
        <Badge variant="outline">Debug Mode</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">YouTube URL</label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Test Type</label>
            <div className="flex gap-2">
              <Button
                variant={testType === 'lambda' ? 'primary' : 'primaryOutline'}
                onClick={() => setTestType('lambda')}
                size="sm"
              >
                Lambda Only
              </Button>
              <Button
                variant={testType === 'local' ? 'primary' : 'primaryOutline'}
                onClick={() => setTestType('local')}
                size="sm"
              >
                Local Only
              </Button>
              <Button
                variant={testType === 'both' ? 'primary' : 'primaryOutline'}
                onClick={() => setTestType('both')}
                size="sm"
              >
                Both
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={runTests} disabled={isLoading}>
              {isLoading ? "Testing..." : "Run Tests"}
            </Button>
            <Button onClick={testMockData} variant="primaryOutline">
              Test Mock Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Video ID:</strong> {testResults.videoId}
              </div>
              <div>
                <strong>Timestamp:</strong> {testResults.timestamp}
              </div>
            </div>

            {testResults.environment && (
              <div>
                <h3 className="font-semibold mb-2">Environment</h3>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <div><strong>Lambda URL:</strong> {testResults.environment.lambdaUrl || 'Not set'}</div>
                  <div><strong>Origin:</strong> {testResults.environment.origin}</div>
                </div>
              </div>
            )}

            {testResults.tests && (
              <div className="space-y-4">
                {testResults.tests.lambda && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Lambda Test</h3>
                      {getStatusBadge(testResults.tests.lambda)}
                    </div>
                    <div className="bg-gray-100 p-3 rounded text-sm max-h-60 overflow-y-auto">
                      <pre>{JSON.stringify(testResults.tests.lambda, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {testResults.tests.local && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Local API Test</h3>
                      {getStatusBadge(testResults.tests.local)}
                    </div>
                    <div className="bg-gray-100 p-3 rounded text-sm max-h-60 overflow-y-auto">
                      <pre>{JSON.stringify(testResults.tests.local, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {testResults.tests.mock && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Mock Data Test</h3>
                      {getStatusBadge(testResults.tests.mock)}
                    </div>
                    <div className="bg-gray-100 p-3 rounded text-sm max-h-60 overflow-y-auto">
                      <pre>{JSON.stringify(testResults.tests.mock, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {testResults.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {testResults.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>CORS Error (Multiple Access-Control-Allow-Origin):</strong>
              <p>Your Lambda function is setting CORS headers multiple times. Check your Lambda code and ensure CORS headers are only set once.</p>
            </div>
            <div>
              <strong>500 Internal Server Error:</strong>
              <p>The Lambda function is crashing. Check CloudWatch logs in AWS Console for detailed error messages.</p>
            </div>
            <div>
              <strong>CSP Error:</strong>
              <p>Content Security Policy blocks the request. Already fixed by adding Lambda domain to middleware.ts.</p>
            </div>
            <div>
              <strong>Authentication Error (401):</strong>
              <p>Local API requires authentication, Lambda should not. Make sure credentials are handled correctly.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
