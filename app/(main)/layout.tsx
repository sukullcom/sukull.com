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
        <main className="flex-1 h-full min-h-0 pt-[50px] lg:pt-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1256px] mx-auto pt-6 h-full min-h-0">
            {children}
          </div>
        </main>
      </div>
      <BottomNavigator className="lg:hidden" />
    </>
  );
}
