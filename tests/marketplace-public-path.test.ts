import { describe, expect, it } from "vitest";

import { isPublicMarketplacePath, isPublicShareImage } from "@/lib/marketplace/public-path";

describe("pazar vitrin yolları", () => {
  it("hizmet ve hizmet-ver girişsiz açılır", () => {
    expect(isPublicMarketplacePath("/hizmet")).toBe(true);
    expect(isPublicMarketplacePath("/hizmet-ver")).toBe(true);
    expect(isPublicMarketplacePath("/hizmet/ev-temizligi")).toBe(true);
  });

  it("hizmet veren paneli kapalı kalır", () => {
    expect(isPublicMarketplacePath("/hizmet-veren")).toBe(false);
    expect(isPublicMarketplacePath("/hizmet-veren/ilanlar")).toBe(false);
  });

  it("paylaşım görselleri açıktır", () => {
    expect(isPublicShareImage("/opengraph-image")).toBe(true);
    expect(isPublicShareImage("/hizmet/ev-temizligi/opengraph-image-abc")).toBe(true);
    expect(isPublicShareImage("/hizmet-ver/twitter-image")).toBe(true);
  });
});
