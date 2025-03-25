/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: false, // Disable font optimization to fix preload warnings
  swcMinify: true,
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
  images: {
    domains: [
      'localhost', 
      'bjapihizpcvfzfldcyrl.supabase.co',
      'api.dicebear.com',
    ],
  },
}

module.exports = nextConfig 