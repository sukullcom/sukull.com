"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";

type BottomNavigatorProps = {
  className?: string;
};

export const BottomNavigator = ({ className }: BottomNavigatorProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      setUser(session?.user || null);
    });  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  // Regular navigation items (excluding games, lab, shop)
  const navItems = [
    { href: "/learn", iconSrc: "/desk.svg" },
    { href: "/leaderboard", iconSrc: "/leaderboard.svg" },
    { href: "/study-buddy", iconSrc: "/study_buddy.svg" },
    { href: "/profile", iconSrc: "/mascot_normal.svg" },
  ];

  // Dropdown items for Games, Lab, and Shop
  const dropdownItems = [
    { label: "Oyunlar", href: "/games", iconSrc: "/games.svg" },
    { label: "Laboratuvar", href: "/lab", iconSrc: "/lab.svg" },
    { label: "Mağaza", href: "/shop", iconSrc: "/bag.svg" },
    { label: "Hedefler", href: "/quests", iconSrc: "/quests.svg" },
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
              isActive
                ? "text-green-600"
                : "text-gray-600 hover:text-green-600"
            )}
          >
            <Image
              src={item.iconSrc}
              alt=""
              className="mr-2"
              height={42}
              width={42}
            />
          </Link>
        );
      })}

      {/* Dropdown toggle as a Link */}
      <div className="relative" ref={dropdownRef}>
        <Link
          prefetch={false}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setDropdownOpen(!isDropdownOpen);
          }}
          className="flex flex-col items-center justify-center text-xs"
        >
          <Image src="/more.svg" alt="Menu" height={42} width={42} className="mr-2" />
        </Link>
        {isDropdownOpen && (
          <div className="absolute bottom-14 right-0 w-40 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
            <ul>
              {dropdownItems.map((item) => (
                <li key={item.href}>
                  <Link
                    prefetch={false}
                    href={item.href}
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Image
                      src={item.iconSrc}
                      alt={item.label}
                      height={24}
                      width={24}
                      className="mr-2"
                    />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <Button
          onClick={handleLogout}
          variant="secondary"
          className="justify-start h-[44px] flex items-center pl-3"
        >
          <Image src="/exit.svg" alt="Çıkış Yap" height={20} width={20} />
          <span className="text-left pr-1">Çıkış</span>
        </Button>
      </div>
    </div>
  );
};
