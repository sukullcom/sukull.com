// app/(main)/layout.tsx
import { ReactNode } from "react";
import { MobileHeader } from "@/components/mobile-header";
import { Sidebar } from "@/components/sidebar";
import { BottomNavigator } from "@/components/bottom-navigator";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileHeader />
      <div className="flex h-[100dvh] max-h-[100dvh] min-h-0">
        <Sidebar className="hidden lg:flex" />
        <main className="flex-1 h-full min-h-0 overflow-y-auto overflow-x-hidden pt-[50px] pb-0 max-lg:pb-[var(--app-bottom-inset)] lg:pt-0">
          <div className="max-w-[1256px] mx-auto h-full min-h-0 pt-6">
            {children}
          </div>
        </main>
      </div>
      <BottomNavigator className="lg:hidden" />
    </>
  );
}
