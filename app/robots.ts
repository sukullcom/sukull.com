import { MetadataRoute } from "next";
import { isCodeEditorEnabled, isLabEnabled } from "@/lib/feature-flags";

export default function robots(): MetadataRoute.Robots {
  const baseDisallow = [
    "/admin",
    "/api/",
    "/auth/",
    "/clear-session",
    "/diagnose",
    "/unauthorized",
  ];

  // Soft-sunset bölümleri: kapalıyken crawler'lar tarafından indekslenmesin.
  if (!isLabEnabled()) baseDisallow.push("/lab");
  if (!isCodeEditorEnabled()) baseDisallow.push("/sukull-code-editor");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: baseDisallow,
      },
    ],
    sitemap: "https://sukull.com/sitemap.xml",
  };
}
