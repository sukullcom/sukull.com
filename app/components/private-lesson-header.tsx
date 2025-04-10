"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { 
  Calendar, 
  ClipboardList, 
  Clock, 
  User,
  Users 
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
    loading: true
  });

  // Check if the user is a teacher or student
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Check teacher status
        const teacherResponse = await fetch("/api/private-lesson/check-teacher-status");
        const teacherData = await teacherResponse.json();
        
        // Check student status
        const studentResponse = await fetch("/api/private-lesson/check-student-status");
        const studentData = await studentResponse.json();
        
        setUserStatus({
          isTeacher: teacherData.teacher,
          isStudent: studentData.student,
          loading: false
        });
      } catch (error) {
        console.error("Error checking user status:", error);
        setUserStatus(prev => ({ ...prev, loading: false }));
      }
    };

    checkUserStatus();
  }, []);

  if (userStatus.loading) {
    return <div className="h-16 bg-white shadow-sm flex items-center justify-center">
      <span className="loading loading-spinner loading-sm"></span>
    </div>;
  }

  const isActive = (path: string) => {
    return pathname.includes(path);
  };

  // Teacher navigation items
  const teacherNavItems = [
    {
      name: "Randevularım",
      path: "/private-lesson/teacher-dashboard/bookings",
      icon: <Calendar className="w-4 h-4 mr-2" />
    },
    {
      name: "Uygunluk Saatleri",
      path: "/private-lesson/teacher-dashboard/availability",
      icon: <Clock className="w-4 h-4 mr-2" />
    },
    {
      name: "Profil",
      path: "/private-lesson/teacher-dashboard",
      icon: <User className="w-4 h-4 mr-2" />
    }
  ];

  // Student navigation items
  const studentNavItems = [
    {
      name: "Randevularım",
      path: "/private-lesson/my-bookings",
      icon: <Calendar className="w-4 h-4 mr-2" />
    },
    {
      name: "Öğretmenler",
      path: "/private-lesson/teachers",
      icon: <Users className="w-4 h-4 mr-2" />
    }
  ];

  // Determine which navigation items to show
  const navItems = userStatus.isTeacher ? teacherNavItems : 
                   userStatus.isStudent ? studentNavItems : 
                   [];

  if (navItems.length === 0) {
    return null; // Don't show header if user is neither teacher nor student
  }

  return (
    <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold hidden md:block">
              {userStatus.isTeacher ? "Öğretmen Paneli" : "Öğrenci Paneli"}
            </h2>
            <div className="flex items-center space-x-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.path)}
                  className="flex items-center"
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 