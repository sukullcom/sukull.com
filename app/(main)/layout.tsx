// app/(main)/layout.tsx
import { ReactNode } from "react";
import { MobileHeader } from "@/components/mobile-header";
import { Sidebar } from "@/components/sidebar";
import { BottomNavigator } from "@/components/bottom-navigator";

export default function MainLayout({ children }: { children: ReactNode }) {
  // Bu layout yalnızca ortak tasarımı içerir, KURS KONTROLÜ YOK
  return (
    <>
      <MobileHeader />
      <Sidebar className="hidden lg:flex" />
      <BottomNavigator className="lg:hidden" />
      <main className="lg:pl-[256px] h-full pt-[50px] lg:pt-0 pb-[64px]">
        <div className="max-w-[1056px] mx-auto pt-6 h-full">{children}</div>
      </main>
    </>
  );
}
