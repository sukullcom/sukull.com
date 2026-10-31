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
import { GoogleAdsTag } from "@/components/analytics/google-ads-tag";
import { PWA_ICON_192, PWA_ICON_512 } from "@/lib/pwa-icons";

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
    default: "Sukull — Ücretsiz hizmet ilanı",
    template: "%s | Sukull",
  },
  description:
    "İhtiyacın olan hizmeti seç, ücretsiz ilan aç, teklifleri karşılaştır. Sukull komisyon almaz.",
  // Statik maskot PNG (`public/icons/`, `?v=` ile önbellek kırma).
  // `app/icon.png` → Next `/icon`; `app/apple-icon.png` → `/apple-icon`.
  icons: {
    icon: [
      { url: PWA_ICON_512, type: "image/png", sizes: "512x512" },
      { url: PWA_ICON_192, type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: [{ url: PWA_ICON_512, type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://sukull.com",
    siteName: "Sukull",
    title: "Sukull — Ücretsiz hizmet ilanı",
    description:
      "İhtiyacın olan hizmeti seç, ücretsiz ilan aç, teklifleri karşılaştır. Komisyon yok.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sukull — Ücretsiz hizmet ilanı",
    description:
      "İhtiyacın olan hizmeti seç, ücretsiz ilan aç, teklifleri karşılaştır. Komisyon yok.",
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
    // suppressHydrationWarning: in-app browsers (Instagram/Facebook), auto
    // page-translation, and extensions routinely inject attributes/classes
    // onto <html>/<body> before React hydrates, producing #418/#419/#425
    // "hydration mismatch" noise that is not an app bug. Suppressing here
    // covers only these two top-level nodes; genuine mismatches deeper in the
    // tree still surface normally.
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${nunito.className} antialiased`}
        suppressHydrationWarning
      >
        <GoogleAdsTag />
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
