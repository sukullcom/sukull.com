"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Users,
  Loader2,
  DollarSign,
  CreditCard,
} from "lucide-react";

type UserStatus = {
  isTeacher: boolean;
  isStudent: boolean;
  loading: boolean;
};

export default function PrivateLessonHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [userStatus, setUserStatus] = useState<UserStatus>({
    isTeacher: false,
    isStudent: false,
    loading: true,
  });

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const [teacherRes, studentRes] = await Promise.all([
          fetch("/api/private-lesson/check-teacher-status"),
          fetch("/api/private-lesson/check-student-status"),
        ]);
        const [teacherData, studentData] = await Promise.all([
          teacherRes.json(),
          studentRes.json(),
        ]);
        setUserStatus({
          isTeacher: teacherData.teacher,
          isStudent: studentData.student,
          loading: false,
        });
      } catch {
        setUserStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    checkUserStatus();
  }, []);

  if (userStatus.loading) {
    return (
      <div className="flex items-center justify-center py-4 mb-4">
        <Loader2 className="w-5 h-5 animate-spin text-green-500" />
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === "/private-lesson/teacher-dashboard") return pathname === path;
    return pathname.startsWith(path);
  };

  const teacherNavItems = [
    { name: "Randevularım", path: "/private-lesson/teacher-dashboard/bookings", icon: Calendar },
    { name: "Uygunluk", path: "/private-lesson/teacher-dashboard/availability", icon: Clock },
    { name: "Gelir", path: "/private-lesson/teacher-dashboard/income", icon: DollarSign },
    { name: "Profil", path: "/private-lesson/teacher-dashboard", icon: User },
  ];

  const studentNavItems = [
    { name: "Randevularım", path: "/private-lesson/my-bookings", icon: Calendar },
    { name: "Öğretmenler", path: "/private-lesson/teachers", icon: Users },
    { name: "Kredilerim", path: "/private-lesson/credits", icon: CreditCard },
  ];

  const navItems = userStatus.isTeacher
    ? teacherNavItems
    : userStatus.isStudent
    ? studentNavItems
    : [];

  if (navItems.length === 0) return null;

  return (
    <div className="mb-4 sm:mb-6 px-3 sm:px-0">
      <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 px-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-w-0 ${
                active
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => router.push(item.path)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
