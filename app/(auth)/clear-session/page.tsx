"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, RefreshCw, CircleCheck, Info, XCircle } from "lucide-react";

type StatusEntry = { type: "loading" | "success" | "info" | "error"; message: string };

export default function ClearSessionPage() {
  const [status, setStatus] = useState<StatusEntry[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  const addStatus = (type: StatusEntry["type"], message: string) => {
    setStatus(prev => [...prev, { type, message }]);
  };

  const clearEverything = async () => {
    setIsClearing(true);
    setStatus([]);

    try {
      addStatus("loading", "Signing out from Supabase...");
      const supabase = createClient();
      await supabase.auth.signOut();
      addStatus("success", "Signed out from Supabase");

      addStatus("loading", "Clearing localStorage...");
      localStorage.clear();
      addStatus("success", "Cleared localStorage");

      addStatus("loading", "Clearing sessionStorage...");
      sessionStorage.clear();
      addStatus("success", "Cleared sessionStorage");

      addStatus("loading", "Clearing cookies...");
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      addStatus("success", "Cleared cookies");

      addStatus("loading", "Unregistering service workers...");
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        addStatus("success", `Unregistered ${registrations.length} service worker(s)`);
      } else {
        addStatus("info", "No service workers found");
      }

      addStatus("loading", "Clearing cache storage...");
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        addStatus("success", `Cleared ${cacheNames.length} cache(s)`);
      } else {
        addStatus("info", "No cache storage found");
      }

      addStatus("success", "ALL DONE! Redirecting to login...");
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      addStatus("error", `Error: ${error}`);
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    addStatus("info", "Ready to clear all session data");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-red-600 flex items-center justify-center gap-2">
          <Trash2 className="w-8 h-8" /> Clear Session Data
        </h1>
        
        <p className="text-center text-gray-600 mb-6">
          If you&apos;re having login issues in this browser, click the button below to clear ALL session data and start fresh.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 font-semibold mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Warning: This will:
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
              {status.map((entry, i) => (
                <p key={i} className="text-sm font-mono flex items-center gap-1.5">
                  {entry.type === "loading" && <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />}
                  {entry.type === "success" && <CircleCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                  {entry.type === "info" && <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  {entry.type === "error" && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  {entry.message}
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

