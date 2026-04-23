import { Metadata } from "next";
import { Footer } from "./footer";
import { Header } from "./header";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicShell
      header={<Header />}
      footer={<Footer />}
      mainClassName="bg-white"
    >
      {children}
    </PublicShell>
  );
}
