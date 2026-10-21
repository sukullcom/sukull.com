import { cookies } from "next/headers";

import { MarketFrame } from "@/components/marketplace/market-frame";
import { getServerUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PazarLayout({ children }: { children: React.ReactNode }) {
  const [jar, user] = await Promise.all([cookies(), getServerUser()]);
  const mode = jar.get("sk_market_mode")?.value === "provider" ? "provider" : "customer";
  return (
    <MarketFrame mode={mode} guest={!user}>
      {children}
    </MarketFrame>
  );
}
