import type { Metadata } from "next";
import PrivateLessonHeader from "@/components/private-lesson-header";

export const metadata: Metadata = {
  title: "Özel Ders | Sukull",
  description:
    "Alanında uzman öğretmenlerle birebir özel ders rezervasyonu yap ve takvimi yönet.",
};

/**
 * Server component: `PrivateLessonHeader` kendi içinde `"use client"`
 * olduğundan client akışı korunur ama bu wrapper sunucuda render edilir —
 * metadata eklenebilir ve gereksiz client bundle'a girmez.
 */
export default function PrivateLessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto w-full pt-4 sm:pt-6">
        <PrivateLessonHeader />
      </div>
      <main className="flex-grow w-full">{children}</main>
    </div>
  );
}
