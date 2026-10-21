import type { Metadata } from "next";
import { cookies, headers } from "next/headers";

import { ShareBox } from "@/components/marketplace/share-box";
import { Subpage } from "@/components/marketplace/subpage";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tavsiye et" };

export default async function SharePage() {
  const account = await requireMarketAccount("/ayarlar/tavsiye");
  const jar = await cookies();
  const provider = jar.get("sk_market_mode")?.value === "provider";
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "sukull.com";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const link = `${proto}://${host}/create-account?ref=${encodeURIComponent(account.referralCode)}`;
  const text = provider
    ? `Sukull'da hizmet veriyorum. İşlerini Sukull'da kolayca hallet: ${link}`
    : `Sukull'da ihtiyacım olan hizmeti buluyorum. İşlerini Sukull'da kolayca hallet: ${link}`;

  return (
    <Subpage title={provider ? "Uygulamayı tavsiye et" : "Arkadaşlarına tavsiye et"} backHref="/ayarlar">
      <ShareBox text={text} />
    </Subpage>
  );
}
