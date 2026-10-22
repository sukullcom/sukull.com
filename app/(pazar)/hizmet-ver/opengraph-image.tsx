import { ImageResponse } from "next/og";

import { marketplaceOgMarkup } from "@/lib/marketplace/og-markup";

export const runtime = "edge";
export const alt = "Sukull'da komisyonsuz hizmet ver";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(marketplaceOgMarkup("Komisyonsuz iş al", "Hizmetlerini ekle · Uyan ilanlara teklif yaz"), {
    ...size,
  });
}
