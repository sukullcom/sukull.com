import type { Metadata } from "next";
import type { ReactNode } from "react";
import PrivateLessonHeader from "@/components/private-lesson-header";

export const metadata: Metadata = {
  title: "Özel Ders | Sukull",
  description:
    "Onaylı eğitmenlerle birebir özel ders talebi oluştur, teklif al ve iletişimi yönet.",
};

/**
 * `PrivateLessonHeader` is now a server component that reads the
 * user's role directly from the DB. Making this layout async lets
 * us await it without flashing a loading shimmer, and keeps the
 * nav off the client bundle except for the tiny active-link
 * highlighter (`PrivateLessonNav`).
 */
export default async function PrivateLessonLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 w-full">
      <div className="max-w-5xl mx-auto w-full pt-4 sm:pt-6">
        <PrivateLessonHeader />
      </div>
      <main className="flex-grow w-full min-h-0 pb-2 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
