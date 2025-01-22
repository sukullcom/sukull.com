"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { SidebarItem } from "./sidebar-item";
import learnIcon from "@/public/desk.svg";
import leaderboardIcon from "@/public/leaderboard.svg";
import questsIcon from "@/public/quests.svg";
import shopIcon from "@/public/bag.svg";
import gameIcon from "@/public/games.svg";
import labIcon from "@/public/lab.svg";
import privateLessonIcon from "@/public/private_lesson.svg";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/app/firebase-client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

type Props = {
  className?: string;
};

export const Sidebar = ({ className }: Props) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    await fetch("/api/clearToken", { method: "POST" });
    router.push("/login");
  };

  return (
    <div
      className={cn(
        `flex h-full lg:w-[256px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col bg-white`,
        className
      )}
    >
      <Link href="/learn">
        <div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
          <Image
            src="/mascot_purple.svg"
            height={40}
            width={40}
            alt="Sukull Mascot"
          />
          <h1 className="text-2xl font-extrabold text-green-600 tracking-wide">
            Sukull
          </h1>
        </div>
      </Link>
      <div className="flex flex-col gap-y-2 flex-1">
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
        <SidebarItem label="Laboratuvarlar" href="/lab" iconSrc={labIcon} />
        <SidebarItem label="Hedefler" href="/quests" iconSrc={questsIcon} />
        <SidebarItem label="Çantam" href="/shop" iconSrc={shopIcon} />
      </div>
      <div className="p-4">
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-gray-400 rounded-full border-r-transparent" />
        ) : user ? (
          <Button variant="danger" onClick={handleSignOut}>Çıkış Yap</Button>
        ) : (
          <Button variant="secondary" onClick={() => router.push("/login")}>Giriş Yap</Button>
        )}
      </div>
    </div>
  );
};
