import { Footer } from "./footer";
import { Header } from "./header";
import { PublicShell } from "@/components/public-shell";

// Statik prerender (revalidate) denendi — build'de "Element type is invalid"
// (undefined component) ile /, /yasal/*, /hakkimizda patlıyor; kök neden
// ayrıca araştırılacak. Şimdilik force-dynamic (Faz 1 diğer kalemler geçerli).
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
