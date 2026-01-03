"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

export default function DiagnosePage() {
  const [diagnostics, setDiagnostics] = useState<Record<string, string | number | boolean | string[] | null>>({});

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results: Record<string, string | number | boolean | string[] | null> = {};

    // 1. Check cookies
    results.cookies = document.cookie;
    results.hasCookies = document.cookie.length > 0;
    results.supabaseCookies = document.cookie.split(';')
      .filter(c => c.includes('sb-') || c.includes('supabase'))
      .map(c => c.trim());

    // 2. Check localStorage
    results.localStorageKeys = Object.keys(localStorage);
    results.localStorageCount = Object.keys(localStorage).length;

    // 3. Check sessionStorage
    results.sessionStorageKeys = Object.keys(sessionStorage);
    results.sessionStorageCount = Object.keys(sessionStorage).length;

    // 4. Check Supabase session
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    results.supabaseSession = !!session;
    results.supabaseError = error?.message || null;
    results.userId = session?.user?.id || null;
    results.userEmail = session?.user?.email || null;

    // 5. Check browser info
    results.userAgent = navigator.userAgent;
    results.cookiesEnabled = navigator.cookieEnabled;
    results.doNotTrack = navigator.doNotTrack;

    // 6. Check third-party cookies
    results.storageAccessAPI = 'requestStorageAccess' in document;

    setDiagnostics(results);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-4">
          🔍 Browser Diagnostics
        </h1>
        
        <p className="text-center text-gray-600 mb-6">
          This page helps diagnose login issues
        </p>

        <Button
          onClick={runDiagnostics}
          className="w-full mb-6"
        >
          Refresh Diagnostics
        </Button>

        <div className="space-y-4">
          <DiagnosticSection
            title="🍪 Cookies"
            data={{
              'Cookies Enabled': diagnostics.cookiesEnabled ? '✅ Yes' : '❌ No',
              'Has Cookies': diagnostics.hasCookies ? '✅ Yes' : '❌ No',
              'Supabase Cookies': Array.isArray(diagnostics.supabaseCookies) && diagnostics.supabaseCookies.length > 0
                ? `✅ ${diagnostics.supabaseCookies.length} found` 
                : '❌ None found',
              'Cookie String Length': typeof diagnostics.cookies === 'string' ? diagnostics.cookies.length : 0,
            }}
          />

          <DiagnosticSection
            title="💾 Storage"
            data={{
              'localStorage Keys': diagnostics.localStorageCount || 0,
              'sessionStorage Keys': diagnostics.sessionStorageCount || 0,
            }}
          />

          <DiagnosticSection
            title="🔐 Supabase Session"
            data={{
              'Has Session': diagnostics.supabaseSession ? '✅ Yes' : '❌ No',
              'User ID': diagnostics.userId || 'None',
              'User Email': diagnostics.userEmail || 'None',
              'Error': diagnostics.supabaseError || 'None',
            }}
          />

          <DiagnosticSection
            title="🌐 Browser Info"
            data={{
              'User Agent': diagnostics.userAgent,
              'Cookies Enabled': diagnostics.cookiesEnabled ? '✅ Yes' : '❌ No',
              'Do Not Track': diagnostics.doNotTrack || 'Not set',
              'Storage Access API': diagnostics.storageAccessAPI ? '✅ Available' : '❌ Not available',
            }}
          />

          {Array.isArray(diagnostics.supabaseCookies) && diagnostics.supabaseCookies.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Supabase Cookies Found:</h3>
              <div className="space-y-1">
                {diagnostics.supabaseCookies.map((cookie, i) => (
                  <p key={i} className="text-xs font-mono break-all">
                    {String(cookie)}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-800">
              📋 Interpretation:
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>
                <strong>Cookies Enabled:</strong>{' '}
                {diagnostics.cookiesEnabled 
                  ? '✅ Good - Cookies are allowed'
                  : '❌ Problem - Enable cookies in browser settings'}
              </li>
              <li>
                <strong>Supabase Cookies:</strong>{' '}
                {Array.isArray(diagnostics.supabaseCookies) && diagnostics.supabaseCookies.length > 0
                  ? '✅ Good - Supabase cookies are present'
                  : '❌ Problem - No Supabase cookies (login will fail)'}
              </li>
              <li>
                <strong>Has Session:</strong>{' '}
                {diagnostics.supabaseSession
                  ? '✅ Good - You are logged in'
                  : '⚠️ Not logged in (expected if you just cleared session)'}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Button
            variant="primaryOutline"
            onClick={() => window.location.href = '/login'}
            className="flex-1"
          >
            Go to Login
          </Button>
          <Button
            variant="dangerOutline"
            onClick={() => window.location.href = '/clear-session'}
            className="flex-1"
          >
            Clear Session
          </Button>
        </div>
      </div>
    </div>
  );
}

function DiagnosticSection({ title, data }: { title: string; data: Record<string, string | number | boolean | string[] | null> }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-600">{key}:</span>
            <span className="text-sm text-gray-900 text-right ml-4 break-all max-w-md">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

