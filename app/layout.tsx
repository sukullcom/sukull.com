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
  // Tarayıcı listedeki ilk uygun ikonu seçer. Dinamik PNG endpoint'ler
  // (`/icon` 512×512, `/apple-icon` 180×180) Satori ile PNG kaynaktan
  // yeniden boyutlandırıldığı için hafif (~50KB). Statik PNG ham dosya
  // (`/heads/happy_excited_purple.png`, ~724KB) doğrulanabilir bir
  // fallback olarak kalsın — Satori herhangi bir nedenle hata verirse
  // tarayıcı yine de doğru maskot ikonunu gösterir. Ham SVG'yi (~1.4MB)
  // favicon listesinden çıkardık; gereksizce ağırdı.
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
      { url: "/icon", type: "image/png", sizes: "192x192" },
      { url: "/heads/happy_excited_purple.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: [{ url: "/icon", type: "image/png" }],
  },
  // Maskot kaynak dosyaları:
  //   PNG (sunucu ikon üretimi + favicon fallback): public/heads/happy_excited_purple.png
  //   SVG (client `<Image>` bileşenleri):           public/heads/happy_excited_purple.svg
  // PNG üreteci endpoints: app/icon.tsx, app/apple-icon.tsx
  // PWA manifest:           app/manifest.ts
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
