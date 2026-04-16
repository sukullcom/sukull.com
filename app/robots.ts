import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/clear-session", "/diagnose", "/avatar-test", "/unauthorized"],
      },
    ],
    sitemap: "https://sukull.com/sitemap.xml",
  };
}
