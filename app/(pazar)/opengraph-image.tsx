import { ImageResponse } from "next/og";

import { marketplaceOgMarkup } from "@/lib/marketplace/og-markup";

export const runtime = "edge";
export const alt = "Sukull — ücretsiz hizmet ilanı, teklif karşılaştır";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(marketplaceOgMarkup("İhtiyacın olan hizmete ulaş", "Ücretsiz ilan · Teklif karşılaştır · Komisyon yok"), {
    ...size,
  });
}
