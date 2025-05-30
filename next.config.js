/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: true, // Enable font optimization for better performance
  swcMinify: true,
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
  // Configure image optimization
  images: {
    domains: [
      'localhost', 
      'bjapihizpcvfzfldcyrl.supabase.co',
      'bgmltlmpjkxojmotnhlv.supabase.co',
      'api.dicebear.com',
      'sukull.com',
      'avataaars.io',
      // Google profile images
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
      // Additional Google domains that might be used
      'googleusercontent.com',
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avataaars.io',
        pathname: '/**',
      }
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable SWC compiler for more efficient builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  // Workaround for ESLint linting issues during build
  eslint: {
    ignoreDuringBuilds: false, // We're using the lint:fix script before building
  },
  typescript: {
    // Ignore type errors in scripts during build
    ignoreBuildErrors: true,
  },
  // Output standalone build for better optimization in production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
}

module.exports = nextConfig 