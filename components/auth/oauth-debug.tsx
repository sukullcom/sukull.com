"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface DebugInfo {
  currentUrl?: string;
  origin?: string;
  hasSession?: boolean;
  sessionUser?: string;
  supabaseUrl?: string;
  redirectUrl?: string;
  timestamp?: string;
  userAgent?: string;
  localStorage?: {
    hasOAuthRedirect: boolean;
    oauthRedirect: string | null;
  };
  error?: string;
}

export function OAuthDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testOAuthConfig = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Get current session
      const { data: session } = await supabase.auth.getSession();
      
      // Get current URL info
      const currentUrl = window.location.href;
      const origin = window.location.origin;
      
      const info: DebugInfo = {
        currentUrl,
        origin,
        hasSession: !!session.session,
        sessionUser: session.session?.user?.email || 'No user',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        redirectUrl: `${origin}/api/auth/callback`,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        localStorage: {
          hasOAuthRedirect: !!sessionStorage.getItem('oauth_redirect_url'),
          oauthRedirect: sessionStorage.getItem('oauth_redirect_url')
        }
      };
      
      setDebugInfo(info);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDebugInfo({ error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = () => {
    sessionStorage.removeItem('oauth_redirect_url');
    localStorage.clear();
    setDebugInfo(null);
    alert('Storage cleared!');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">🔧 OAuth Debug Tool</h2>
      
      <div className="flex gap-3 mb-4">
        <Button onClick={testOAuthConfig} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Test OAuth Config'}
        </Button>
        <Button variant="secondaryOutline" onClick={clearStorage}>
          Clear Storage
        </Button>
      </div>

      {debugInfo && (
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Debug Information:</h3>
          <pre className="text-xs overflow-auto bg-gray-100 p-3 rounded">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Quick Checklist:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Make sure your Supabase Site URL matches your domain</li>
          <li>Add all redirect URLs to Supabase Auth settings</li>
          <li>Check Google Console OAuth configuration</li>
          <li>Clear browser cache and try incognito mode</li>
          <li>Check browser console for additional error messages</li>
        </ul>
      </div>
    </div>
  );
} 