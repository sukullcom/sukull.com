import { cookies } from "next/headers";

import { CatalogBridge } from "@/components/marketplace/catalog-bridge";
import { MarketFrame } from "@/components/marketplace/market-frame";
import { getServerUser } from "@/lib/auth";
import { ensureCustomServices } from "@/lib/marketplace/custom-services";

export default async function PazarLayout({ children }: { children: React.ReactNode }) {
  const [jar, user, extra] = await Promise.all([cookies(), getServerUser(), ensureCustomServices()]);
  const mode = jar.get("sk_market_mode")?.value === "provider" ? "provider" : "customer";
  return (
    <MarketFrame mode={mode} guest={!user}>
      <CatalogBridge extra={extra}>{children}</CatalogBridge>
    </MarketFrame>
  );
}
