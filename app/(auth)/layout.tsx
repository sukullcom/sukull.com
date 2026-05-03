import { Metadata } from "next";
import { Footer } from "./footer";
import { Header } from "./header";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Prerender sırasında bileşen ağacı hata veriyor; segment dinamik render.
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicShell
      header={<Header />}
      footer={<Footer />}
      mainClassName="bg-card"
    >
      {children}
    </PublicShell>
  );
}
