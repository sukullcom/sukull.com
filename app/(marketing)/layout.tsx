import { Footer } from "./footer";
import { Header } from "./header";
import { PublicShell } from "@/components/public-shell";

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
