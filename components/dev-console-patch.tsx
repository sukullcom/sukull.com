/**
 * DEV-ONLY: 3rd party (YouTube iframe API, Google Ads, Monaco/WebGL)
 * kaynaklı, bizim kodumuzla ilgisi olmayan ve ayıklanamayan console
 * hataları ve uyarılarını bastırır. Üretimde bu dosya `app/layout.tsx`
 * tarafından render edilmez, bu yüzden hiçbir yük üretmez.
 *
 * Neden ayrı bir client component?
 *   • Root layout'u server component olarak tutmak ve hydration'a karışan
 *     inline <script> bloğunu kaldırmak için.
 *   • `dangerouslySetInnerHTML` yerine `useEffect` idiomatic React akışı.
 *
 * DİKKAT: Yalnızca aşağıdaki tanınan desenleri susturur; gerçek hatalar
 * geçmeye devam eder.
 */
"use client";

import { useEffect } from "react";

const SUPPRESSED_ERROR_PATTERNS: ReadonlyArray<string> = [
  "Failed to execute 'postMessage'",
  "www-widgetapi.js",
  "YouTube.js",
  "target origin provided",
  "doubleclick.net",
  "googleads",
  "net::ERR_FAILED",
  "GroupMarkerNotSet",
  "crbug.com",
  "base.js", // doubleclick base.js
];

const SUPPRESSED_WARN_PATTERNS: ReadonlyArray<string> = [
  "Blocked aria-hidden",
  "descendant retained focus",
  "ytp-play-button",
  "WebGL has been deprecated",
  "--enable-unsafe-swiftshader",
  "aria-hidden", // YouTube
];

function matches(msg: string, patterns: ReadonlyArray<string>) {
  return patterns.some((p) => msg.includes(p));
}

export function DevConsolePatch() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const origError = console.error;
    const origWarn = console.warn;

    console.error = (...args: unknown[]) => {
      const joined = args.map(String).join(" ");
      if (matches(joined, SUPPRESSED_ERROR_PATTERNS)) return;
      origError(...args);
    };

    console.warn = (...args: unknown[]) => {
      const joined = args.map(String).join(" ");
      if (matches(joined, SUPPRESSED_WARN_PATTERNS)) return;
      origWarn(...args);
    };

    return () => {
      console.error = origError;
      console.warn = origWarn;
    };
  }, []);

  return null;
}
