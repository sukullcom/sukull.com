/** @type {import('next').NextConfig} */

import withBundleAnalyzerFactory from '@next/bundle-analyzer';

/**
 * Bundle analyzer is opt-in via env var so CI / regular builds don't pay
 * the extra time cost. Run locally with `npm run analyze`.
 */
const withBundleAnalyzer = withBundleAnalyzerFactory({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

const allowedOrigins = [
  "https://sukull.com",
  "https://www.sukull.com",
  process.env.NODE_ENV !== "production" && "http://localhost:3000",
].filter(Boolean).join(", ");

const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  /**
   * Legacy endpoint rewrites.
   *
   * `rewrites()` happens at the edge with no lambda invocation — the request
   * is proxied to the consolidated handler without an extra 301 + round-trip.
   * The old route.ts files used NextResponse.redirect() which forced a second
   * network request from the client; a pure rewrite is strictly cheaper.
   */
  async rewrites() {
    return [
      {
        source: '/api/schools/search',
        destination: '/api/schools?action=search',
      },
      {
        source: '/api/schools/leaderboard',
        destination: '/api/schools?action=leaderboard',
      },
      // Admin application listings were previously served from dedicated
      // routes that 307-redirected to the consolidated handler. After
      // removing those wrappers the canonical endpoint is a query-param
      // variant; these rewrites preserve the old URL shape for any
      // external tooling / bookmarks while avoiding the extra redirect.
      // `[id]` subroutes still resolve normally because rewrites only
      // match the exact source path.
      {
        source: '/api/admin/teacher-applications',
        destination: '/api/admin?action=teacher-applications',
      },
      {
        source: '/api/admin/student-applications',
        destination: '/api/admin?action=student-applications',
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: allowedOrigins,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sukull.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avataaars.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Avatars, course thumbnails, mascots and most images are effectively
    // immutable per-URL (when an avatar changes, the URL changes too —
    // Supabase-storage uploads generate a new key; Google OAuth provides a
    // cacheable CDN URL). 1-minute TTL caused Vercel Image Optimization to
    // re-fetch and re-encode on nearly every request. Bumping to 1 year
    // (the max allowed) turns this into a one-time encoding cost per image.
    // If a URL ever needs to expire sooner, pass cache-control headers at
    // the source (Supabase can do this per-object).
    minimumCacheTTL: 31_536_000,
    // SVG support is enabled only because our own `public/*.svg` mascots and
    // icons need to flow through `next/image`. **User-uploaded SVGs are
    // explicitly rejected at the upload boundary** (`app/api/upload/image/route.ts`)
    // to prevent XSS via embedded <script> payloads. The CSP below still
    // sandboxes any SVG rendered by next/image (no scripts, no forms, no
    // plugins) as defence-in-depth against a compromised first-party asset.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

export default withBundleAnalyzer(nextConfig);
