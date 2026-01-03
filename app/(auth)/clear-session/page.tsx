"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ClearSessionPage() {
  const [status, setStatus] = useState<string[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, message]);
  };

  const clearEverything = async () => {
    setIsClearing(true);
    setStatus([]);

    try {
      // 1. Sign out from Supabase
      addStatus("🔄 Signing out from Supabase...");
      const supabase = createClient();
      await supabase.auth.signOut();
      addStatus("✅ Signed out from Supabase");

      // 2. Clear all localStorage
      addStatus("🔄 Clearing localStorage...");
      localStorage.clear();
      addStatus("✅ Cleared localStorage");

      // 3. Clear all sessionStorage
      addStatus("🔄 Clearing sessionStorage...");
      sessionStorage.clear();
      addStatus("✅ Cleared sessionStorage");

      // 4. Clear all cookies
      addStatus("🔄 Clearing cookies...");
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      addStatus("✅ Cleared cookies");

      // 5. Clear service workers
      addStatus("🔄 Unregistering service workers...");
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        addStatus(`✅ Unregistered ${registrations.length} service worker(s)`);
      } else {
        addStatus("ℹ️ No service workers found");
      }

      // 6. Clear cache storage
      addStatus("🔄 Clearing cache storage...");
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        addStatus(`✅ Cleared ${cacheNames.length} cache(s)`);
      } else {
        addStatus("ℹ️ No cache storage found");
      }

      addStatus("✅ ALL DONE! Redirecting to login...");
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      addStatus(`❌ Error: ${error}`);
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    // Show info on load
    addStatus("ℹ️ Ready to clear all session data");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-red-600">
          🧹 Clear Session Data
        </h1>
        
        <p className="text-center text-gray-600 mb-6">
          If you&apos;re having login issues in this browser, click the button below to clear ALL session data and start fresh.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 font-semibold mb-2">
            ⚠️ Warning: This will:
          </p>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Sign you out from Supabase</li>
            <li>Clear all localStorage</li>
            <li>Clear all sessionStorage</li>
            <li>Clear all cookies</li>
            <li>Unregister service workers</li>
            <li>Clear cache storage</li>
          </ul>
        </div>

        <Button
          onClick={clearEverything}
          disabled={isClearing}
          className="w-full mb-6 bg-red-600 hover:bg-red-700 text-white"
          size="lg"
        >
          {isClearing ? "Clearing..." : "Clear Everything & Fix Login"}
        </Button>

        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h2 className="font-semibold mb-2">Status:</h2>
          {status.length === 0 ? (
            <p className="text-gray-500 text-sm">No actions yet...</p>
          ) : (
            <div className="space-y-1">
              {status.map((msg, i) => (
                <p key={i} className="text-sm font-mono">
                  {msg}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="primaryOutline"
            onClick={() => router.push('/login')}
            disabled={isClearing}
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}

