"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/app/firebase-client";
import { Button } from "./ui/button";

type BottomNavigatorProps = {
  className?: string;
};

export const BottomNavigator = ({ className }: BottomNavigatorProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    await fetch("/api/clearToken", { method: "POST" });
    router.push("/login");
  };

  const navItems = [
    { href: "/learn", iconSrc: "/desk.svg" },
    { href: "/games", iconSrc: "/games.svg" },
    { href: "/leaderboard", iconSrc: "/leaderboard.svg" },
    { href: "/lab", iconSrc: "/lab.svg" },
    { href: "/quests", iconSrc: "/quests.svg" },
    { href: "/shop", iconSrc: "/bag.svg" },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 w-full bg-white border-t flex justify-around items-center px-4 py-2 shadow-md z-50",
        className
      )}
      style={{ height: "64px" }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
          prefetch={false}
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center text-xs",
              isActive ? "text-green-600" : "text-gray-600 hover:text-green-600"
            )}
          >
            <Image
              src={item.iconSrc}
              alt=""
              className="mr-2"
              height={48}
              width={48}
            />
          </Link>
        );
      })}
      <div className="">
        {
          <Button
            onClick={handleSignOut}
            variant="secondary"
            className="justify-start h-[44px] flex items-center pl-3"
          >
            <Image
              src="/exit.png"
              alt="Çıkış Yap"
              height={20}
              width={20}
            />
            <span className="text-left pr-1">Çıkış</span>
          </Button>
        }
      </div>
    </div>
  );
};
