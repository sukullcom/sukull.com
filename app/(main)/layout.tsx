import { MobileHeader } from "@/components/mobile-header";
import { Sidebar } from "@/components/sidebar";
import { BottomNavigator } from "@/components/bottom-navigator";

type Props = {
  children: React.ReactNode;
};

const MainLayout = ({ children }: Props) => {
  return (
    <>
      <MobileHeader />
      {/* Sidebar for larger screens */}
      <Sidebar className="hidden lg:flex" />
      {/* Bottom navigator for smaller screens */}
      <BottomNavigator className="lg:hidden" />
      <main className="lg:pl-[256px] h-full pt-[50px] lg:pt-0 pb-[64px]">
        <div className="max-w-[1056px] mx-auto pt-6 h-full">{children}</div>
      </main>
    </>
  );
};

export default MainLayout;
