"use client";

import PrivateLessonHeader from "@/app/components/private-lesson-header";

interface PrivateLessonLayoutProps {
  children: React.ReactNode;
}

export default function PrivateLessonLayout({ children }: PrivateLessonLayoutProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto w-full pt-4 sm:pt-6">
        <PrivateLessonHeader />
      </div>
      <main className="flex-grow w-full">{children}</main>
    </div>
  );
}
