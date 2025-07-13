"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { SidebarItem } from "./sidebar-item";
import learnIcon from "@/public/desk.svg";
import leaderboardIcon from "@/public/leaderboard.svg";
import shopIcon from "@/public/bag.svg";
import gameIcon from "@/public/games.svg";
import labIcon from "@/public/lab.svg";
import privateLessonIcon from "@/public/private_lesson.svg";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useSecureLogout } from "@/hooks/use-secure-logout";


type Props = {
  className?: string;
};

export const Sidebar = ({ className }: Props) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { logout, isLoggingOut } = useSecureLogout();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }: { data: { session: { user: User } | null } }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  const handleLogout = async () => {
    await logout({
      showToast: true,
      redirectTo: '/login'
    });
  };

  return (
    <div
      className={cn(
        `flex h-full w-full lg:w-[256px] lg:sticky lg:top-0 px-4 border-r-2 flex-col bg-white lg:h-screen`,
        className
      )}
    >
      <Link prefetch={false} href="/learn">
        <div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
          <Image
            src="/mascot_purple.svg"
            height={40}
            width={40}
            alt="Sukull Mascot"
          />
          <h1 className="text-2xl font-extrabold text-green-500 tracking-wide">
            Sukull
          </h1>
        </div>
      </Link>
      <div className="flex flex-col gap-y-2 flex-1 overflow-y-auto">
        <SidebarItem label="Çalışma Masası" href="/learn" iconSrc={learnIcon} />
        <SidebarItem
          label="Özel Ders"
          href="/private-lesson"
          iconSrc={privateLessonIcon}
        />
        <SidebarItem label="Oyunlar" href="/games" iconSrc={gameIcon} />
        <SidebarItem
          label="Puan Tabloları"
          href="/leaderboard"
          iconSrc={leaderboardIcon}
        />
        {/* Temporarily disabled - lab functionality */}
        {/* <SidebarItem label="Laboratuvarlar" href="/lab" iconSrc={labIcon} /> */}
        <SidebarItem label="Çantam" href="/shop" iconSrc={shopIcon} />
        <SidebarItem label="Çalışma Arkadaşı" href="/study-buddy" iconSrc="/study_buddy.svg" />
        <SidebarItem label="Profİl" href="/profile" iconSrc="/mascot_normal.svg" />
      </div>
      <div className="p-4 mt-auto">
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="secondary"
          className="justify-start h-[52px] flex items-center w-full"
        >
          <Image
            src="/exit.svg"
            alt="Çıkış Yap"
            className="mr-1"
            height={26}
            width={26}
          />
          <span className="text-left">
            {isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
          </span>
        </Button>
      </div>
    </div>
  );
};
