// app/(main)/layout.tsx
import { ReactNode } from "react";
import { MobileHeader } from "@/components/mobile-header";
import { Sidebar } from "@/components/sidebar";
import { BottomNavigator } from "@/components/bottom-navigator";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileHeader />
      <div className="flex h-screen">
        <Sidebar className="hidden lg:flex" />
        <main className="flex-1 h-full pt-[50px] lg:pt-0 pb-[64px] overflow-y-auto">
          <div className="max-w-[1256px] mx-auto pt-6 h-full">
            {children}
          </div>
        </main>
      </div>
      <BottomNavigator className="lg:hidden" />
    </>
  );
}
