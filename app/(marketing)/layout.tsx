import { Footer } from "./footer";
import { Header } from "./header";
import { PublicShell } from "@/components/public-shell";

// Prerender sırasında bileşen ağacı hata veriyor; segment dinamik render.
export const dynamic = "force-dynamic";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicShell header={<Header />} footer={<Footer />}>
      {children}
    </PublicShell>
  );
}
