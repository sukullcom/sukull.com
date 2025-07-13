// app/layout.tsx
import "./globals.css";
import { Nunito } from "next/font/google";
import { Metadata } from "next";
import { CustomToaster } from "@/components/ui/custom-toaster";
import { ExitModal } from "@/components/modals/exit-modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";

const nunito = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sukull - Interactive Learning Platform",
  description: "Learn through interactive games, coding challenges, and educational content",
  icons: {
    icon: [
      { url: '/mascot_normal.svg', type: 'image/svg+xml' },
      { url: '/mascot_normal.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: '/mascot_normal.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/mascot_normal.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/mascot_normal.svg" />
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Comprehensive error suppression for development environment
                if (typeof window !== 'undefined') {
                  const originalConsoleError = console.error;
                  const originalConsoleWarn = console.warn;
                  
                  console.error = function(...args) {
                    const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '');
                    const fullMessage = args.join(' ');
                    
                    // YouTube and third-party service errors that are expected and non-critical
                    if (
                      message.includes('Failed to execute \\'postMessage\\'') ||
                      message.includes('www-widgetapi.js') ||
                      message.includes('YouTube.js') ||
                      fullMessage.includes('target origin provided') ||
                      fullMessage.includes('youtube.com') && fullMessage.includes('localhost') ||
                      message.includes('Access to fetch at') && message.includes('doubleclick.net') ||
                      message.includes('CORS policy') && message.includes('googleads') ||
                      message.includes('net::ERR_FAILED') && message.includes('doubleclick.net') ||
                      message.includes('GroupMarkerNotSet') ||
                      message.includes('crbug.com') ||
                      fullMessage.includes('base.js') && fullMessage.includes('doubleclick')
                    ) {
                      return; // Skip these non-critical errors
                    }
                    
                    originalConsoleError.apply(console, args);
                  };
                  
                  console.warn = function(...args) {
                    const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '');
                    const fullMessage = args.join(' ');
                    
                    // Suppress known non-critical warnings
                    if (
                      message.includes('Blocked aria-hidden') ||
                      message.includes('descendant retained focus') ||
                      message.includes('ytp-play-button') ||
                      message.includes('WebGL has been deprecated') ||
                      message.includes('--enable-unsafe-swiftshader') ||
                      fullMessage.includes('aria-hidden') && fullMessage.includes('YouTube')
                    ) {
                      return; // Skip these non-critical warnings
                    }
                    
                    originalConsoleWarn.apply(console, args);
                  };
                }
              `,
            }}
          />
        )}
      </head>
      <body className={`${nunito.className} antialiased`}>
        <CustomToaster />
        <ExitModal />
        <HeartsModal />
        <PracticeModal />
        {children}
      </body>
    </html>
  );
}
