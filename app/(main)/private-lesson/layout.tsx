"use client";

import PrivateLessonHeader from "@/app/components/private-lesson-header";

interface PrivateLessonLayoutProps {
  children: React.ReactNode;
}

export default function PrivateLessonLayout({ children }: PrivateLessonLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <PrivateLessonHeader />
      <main className="flex-grow">{children}</main>
    </div>
  );
} 