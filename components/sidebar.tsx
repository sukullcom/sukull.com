"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { SidebarItem } from "./sidebar-item";
import learnIcon from "@/public/learn.svg";
import leaderboardIcon from "@/public/leaderboard.svg";
import questsIcon from "@/public/quests.svg";
import shopIcon from "@/public/shop.svg";
import gameIcon from "@/public/games.svg";
import privateLessonIcon from "@/public/private_lesson.svg";
import studyBuddyIcon from "@/public/study_buddy.svg";
import profileIcon from "@/public/profile.svg";
import { BRAND_MASCOT_PATH } from "@/lib/brand-mascot";

type Props = {
  className?: string;
};

export const Sidebar = ({ className }: Props) => {
  return (
    <div
      className={cn(
        "flex h-full w-full shrink-0 flex-col bg-background px-4",
        /* ~280px masaüstünde sabit; dar alanda taşmadan sığması için akışkan tavan */
        "lg:w-[min(280px,100%)] lg:sticky lg:top-0 lg:h-screen",
        "border-r border-border/35",
        "shadow-[4px_0_24px_-16px_rgba(15,23,42,0.12)] dark:shadow-[4px_0_24px_-16px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <Link prefetch={false} href="/learn">
        <div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
          <Image
            src={BRAND_MASCOT_PATH}
            height={40}
            width={40}
            alt="Sukull"
            className="object-contain"
          />
          <h1 className="text-2xl font-extrabold text-primary tracking-wide">
            Sukull
          </h1>
        </div>
      </Link>
      <div className="flex flex-col gap-y-2 flex-1 overflow-y-auto">
        <SidebarItem label="Dersler" href="/learn" iconSrc={learnIcon} />
        <SidebarItem
          label="Özel Ders"
          href="/private-lesson"
          iconSrc={privateLessonIcon}
        />
        <SidebarItem label="Oyunlar" href="/games" iconSrc={gameIcon} />
        <SidebarItem
          label="Puan Tablosu"
          href="/leaderboard"
          iconSrc={leaderboardIcon}
        />
        <SidebarItem label="Hedefler" href="/quests" iconSrc={questsIcon} />
        <SidebarItem label="Mağaza" href="/shop" iconSrc={shopIcon} />
        <SidebarItem label="Çalışma Arkadaşı" href="/study-buddy" iconSrc={studyBuddyIcon} />
        <SidebarItem label="Profil" href="/profile" iconSrc={profileIcon} />
      </div>
    </div>
  );
};
