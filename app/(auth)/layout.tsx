import { Metadata } from "next";
import { Footer } from "./footer";
import { Header } from "./header";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Üstte header */}
      <Header />
      {/* Ortada sayfa içeriği */}
      <main className="flex-1 flex items-center justify-center bg-white">
        {children}
      </main>
      {/* Altta footer */}
      <Footer />
    </div>
  );
}
