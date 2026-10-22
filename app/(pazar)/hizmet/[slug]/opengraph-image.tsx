import { ImageResponse } from "next/og";

import { getService } from "@/lib/marketplace/catalog";
import { marketplaceOgMarkup } from "@/lib/marketplace/og-markup";

export const runtime = "edge";
export const alt = "Sukull hizmet ilanı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { slug: string } }) {
  const service = getService(params.slug);
  const title = service ? `${service.name} teklifi al` : "Hizmet teklifi al";
  return new ImageResponse(marketplaceOgMarkup(title, "Ücretsiz ilan · En fazla dört teklif · Komisyon yok"), {
    ...size,
  });
}
