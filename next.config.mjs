/** @type {import('next').NextConfig} */

const allowedOrigins = [
  "https://sukull.com",
  "https://www.sukull.com",
  process.env.NODE_ENV !== "production" && "http://localhost:3000",
].filter(Boolean).join(", ");

const nextConfig = {
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
};

export default nextConfig;
