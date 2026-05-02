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
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card p-8 shadow-xl">
        <h1 className="mb-4 flex items-center justify-center gap-2 text-center text-3xl font-bold text-destructive">
          <Trash2 className="h-8 w-8" /> Clear Session Data
        </h1>
        
        <p className="mb-6 text-center text-muted-foreground">
          If you&apos;re having login issues in this browser, click the button below to clear ALL session data and start fresh.
        </p>

        <div className="mb-6 rounded-lg border border-suk-warning-border bg-suk-warning-soft p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-suk-warning-soft-fg">
            <AlertTriangle className="h-4 w-4 shrink-0" /> Warning: This will:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-suk-warning-soft-fg">
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
          className="mb-6 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          size="lg"
        >
          {isClearing ? "Clearing..." : "Clear Everything & Fix Login"}
        </Button>

        <div className="max-h-96 overflow-y-auto rounded-lg bg-muted/60 p-4">
          <h2 className="mb-2 font-semibold">Status:</h2>
          {status.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions yet...</p>
          ) : (
            <div className="space-y-1">
              {status.map((entry, i) => (
                <p key={i} className="flex items-center gap-1.5 font-mono text-sm">
                  {entry.type === "loading" && (
                    <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-suk-payment" />
                  )}
                  {entry.type === "success" && (
                    <CircleCheck className="h-3.5 w-3.5 shrink-0 text-suk-brand" />
                  )}
                  {entry.type === "info" && (
                    <Info className="h-3.5 w-3.5 shrink-0 text-suk-payment-soft-fg" />
                  )}
                  {entry.type === "error" && (
                    <XCircle className="h-3.5 w-3.5 shrink-0 text-suk-danger" />
                  )}
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

