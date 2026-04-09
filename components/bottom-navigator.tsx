"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useSecureLogout } from "@/hooks/use-secure-logout";

type BottomNavigatorProps = {
  className?: string;
};

export const BottomNavigator = ({ className }: BottomNavigatorProps) => {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout, isLoggingOut } = useSecureLogout();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user || null);
    });
  }, []);

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

  const handleLogout = async () => {
    await logout({
      showToast: true,
      redirectTo: '/login'
    });
  };

  const navItems = [
    { href: "/learn", iconSrc: "/desk.svg" },
    { href: "/leaderboard", iconSrc: "/leaderboard.svg" },
    { href: "/study-buddy", iconSrc: "/study_buddy.svg" },
    { href: "/profile", iconSrc: "/mascot_normal.svg" },
  ];

  const dropdownItems = [
    { label: "Özel Ders", href: "/private-lesson", iconSrc: "/private_lesson.svg" },
    { label: "Oyunlar", href: "/games", iconSrc: "/games.svg" },
    { label: "Mağaza", href: "/shop", iconSrc: "/bag.svg" },
    { label: "Hedefler", href: "/quests", iconSrc: "/quests.svg" },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 flex h-[60px] items-center justify-around border-t-2 border-slate-200 bg-white px-4 lg:hidden z-50",
        className
      )}
    >
      {/* Regular navigation items */}
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            prefetch={false}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center text-xs",
              isActive && "text-green-500"
            )}
          >
            <Image
              src={item.iconSrc}
              alt=""
              height={isActive ? 44 : 42}
              width={isActive ? 44 : 42}
              className="mr-2"
            />
          </Link>
        );
      })}

      {/* More dropdown */}
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
          <div className="absolute bottom-14 right-0 w-44 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
            <ul>
              {dropdownItems.map((item) => (
                <li key={item.href}>
                  <Link
                    prefetch={false}
                    href={item.href}
                    className="flex items-center px-4 py-2.5 hover:bg-gray-100"
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
              <li className="border-t border-gray-100">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className="flex items-center w-full px-4 py-2.5 hover:bg-gray-100 text-rose-600"
                >
                  <Image src="/exit.svg" alt="Çıkış" height={24} width={24} className="mr-2" />
                  <span className="text-sm font-medium">
                    {isLoggingOut ? "Çıkış..." : "Çıkış Yap"}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

    </div>
  );
};
