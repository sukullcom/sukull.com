import type { MetadataRoute } from "next";
import { isCodeEditorEnabled, isLabEnabled } from "@/lib/feature-flags";
import { MARKET_ORIGIN, sitemapServicePaths } from "@/lib/marketplace/seo";
import { ensureCustomServices } from "@/lib/marketplace/custom-services";

const BASE_URL = "https://sukull.com";

export const revalidate = 21600;

type Entry = MetadataRoute.Sitemap[number];

function buildStaticEntries(): Entry[] {
  const entries: Entry[] = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    ...sitemapServicePaths().map((path) => ({
      url: `${MARKET_ORIGIN}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "/hizmet" || path === "/hizmet-ver" ? 0.8 : 0.7,
    })),
    { url: `${BASE_URL}/hakkimizda`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/yasal`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/yasal/kvkk`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/yasal/gizlilik`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/yasal/cerez`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/yasal/kullanim-sartlari`, changeFrequency: "yearly", priority: 0.4 },
  ];

  if (isLabEnabled()) {
    entries.push({ url: `${BASE_URL}/lab`, changeFrequency: "weekly", priority: 0.4 });
  }

  if (isCodeEditorEnabled()) {
    entries.push(
      { url: `${BASE_URL}/sukull-code-editor`, changeFrequency: "weekly", priority: 0.5 },
      { url: `${BASE_URL}/sukull-code-editor/snippets`, changeFrequency: "daily", priority: 0.5 },
    );
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureCustomServices();
  const now = new Date();

  return buildStaticEntries().map((e) => ({ ...e, lastModified: e.lastModified ?? now }));
}
