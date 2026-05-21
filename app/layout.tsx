// app/layout.tsx
import "./globals.css";
import { Nunito } from "next/font/google";
import { Metadata, Viewport } from "next";
import { CustomToaster } from "@/components/ui/custom-toaster";
import { ExitModal } from "@/components/modals/exit-modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";
import { GlobalErrorListener } from "@/components/global-error-listener";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { DevConsolePatch } from "@/components/dev-console-patch";

const nunito = Nunito({ subsets: ["latin", "latin-ext"] });

export const viewport: Viewport = {
  themeColor: "#84cc16",
  width: "device-width",
  initialScale: 1,
  /** iOS: env(safe-area-inset-*) değerlerinin geçerli olması için */
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sukull.com"),
  title: {
    default: "Sukull - Öğrenmeyi Eğlenceli Hale Getiren Platform",
    template: "%s | Sukull",
  },
  description:
    "Derslerini tamamla, beyin oyunlarıyla pratik yap, arkadaşlarınla yarış ve özel derslerle ilerle. Sukull ile öğrenmek hiç bu kadar keyifli olmamıştı.",
  // Sıra önemli: tarayıcılar listedeki ilk uygun ikonu kullanır. PNG'yi
  // (Next.js dinamik `/icon` endpoint, ~50KB) önce sıralıyoruz; ham mascot
  // SVG'si (~1.4MB) yedek olarak kalsın. Eski `public/favicon.svg`/`.ico`
  // dosyaları (stylize edilmiş "S" — marka değil) bilinçli olarak
  // silindi; tarayıcılar artık `<link rel="icon">` etiketlerini takip ediyor.
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
      { url: "/icon", type: "image/png", sizes: "192x192" },
      { url: "/heads/happy_excited_purple.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: [{ url: "/icon", type: "image/png" }],
  },
  // Maskot kaynak dosyası: `public/heads/happy_excited_purple.svg`
  // PNG üreteci (PWA / favicon / splash): `app/icon.tsx`, `app/apple-icon.tsx`
  // Manifest: `app/manifest.ts`
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://sukull.com",
    siteName: "Sukull",
    title: "Sukull - Öğrenmeyi Eğlenceli Hale Getiren Platform",
    description:
      "Derslerini tamamla, beyin oyunlarıyla pratik yap, arkadaşlarınla yarış ve özel derslerle ilerle. Sukull ile öğrenmek hiç bu kadar keyifli olmamıştı.",
    // The image is emitted by app/opengraph-image.tsx as a 1200×630 PNG.
  },
  twitter: {
    card: "summary_large_image",
    title: "Sukull - Öğrenmeyi Eğlenceli Hale Getiren Platform",
    description:
      "Derslerini tamamla, beyin oyunlarıyla pratik yap, arkadaşlarınla yarış ve özel derslerle ilerle. Sukull ile öğrenmek hiç bu kadar keyifli olmamıştı.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="tr">
      <body className={`${nunito.className} antialiased`}>
        {isDev && <DevConsolePatch />}
        <GlobalErrorListener />
        <CustomToaster />
        <ExitModal />
        <HeartsModal />
        <PracticeModal />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
