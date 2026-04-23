"use client";

import dynamic from "next/dynamic";

/**
 * `react-confetti` pulls in the canvas-based particle engine (~40KB min+gzip).
 * It's only needed momentarily on celebration events (quiz complete, daily
 * challenge claim, signup success), so we code-split it behind `next/dynamic`.
 *
 * `ssr: false` is correct here because:
 *   • Confetti relies on `window` for width/height defaults.
 *   • The component is purely visual; skipping it on SSR produces no content
 *     loss — users see the celebration only after hydration anyway.
 *
 * Consumers should keep using `<LazyConfetti …/>` with the same props as
 * `react-confetti`; the dynamic wrapper is transparent.
 */
const LazyConfetti = dynamic(() => import("react-confetti"), {
  ssr: false,
});

export default LazyConfetti;
