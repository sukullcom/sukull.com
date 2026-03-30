"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  User,
  Users,
  Loader2,
  DollarSign,
  CreditCard
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
    return (
      <div className="text-center space-y-2 mb-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
    // Exact match for profile page to prevent it from being active on sub-pages
    if (path === "/private-lesson/teacher-dashboard") {
      return pathname === path;
    }
    // For other pages, use includes
    return pathname.includes(path);
  };

  // Teacher navigation items
  const teacherNavItems = [
    {
      name: "Randevularım",
      path: "/private-lesson/teacher-dashboard/bookings",
      icon: <Calendar className="w-4 h-4" />,
      description: "Öğrenci randevularını yönet"
    },
    {
      name: "Uygunluk Saatleri",
      path: "/private-lesson/teacher-dashboard/availability",
      icon: <Clock className="w-4 h-4" />,
      description: "Müsaitlik takvimini düzenle"
    },
    {
      name: "Gelir Takibi",
      path: "/private-lesson/teacher-dashboard/income",
      icon: <DollarSign className="w-4 h-4" />,
      description: "Gelir ve değerlendirmeleri görüntüle"
    },
    {
      name: "Profil",
      path: "/private-lesson/teacher-dashboard",
      icon: <User className="w-4 h-4" />,
      description: "Öğretmen profilini güncelle"
    }
  ];

  // Student navigation items
  const studentNavItems = [
    {
      name: "Randevularım",
      path: "/private-lesson/my-bookings",
      icon: <Calendar className="w-4 h-4" />,
      description: "Ders randevularını görüntüle"
    },
    {
      name: "Öğretmenler",
      path: "/private-lesson/teachers",
      icon: <Users className="w-4 h-4" />,
      description: "Öğretmen ara ve rezervasyon yap"
    },
    {
      name: "Krediler",
      path: "/private-lesson/credits",
      icon: <CreditCard className="w-4 h-4" />,
      description: "Ders kredisi satın al"
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
    <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {userStatus.isTeacher ? "Öğretmen Paneli" : "Özel Ders"}
        </h1>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant={active ? "secondary" : "ghost"}
                  className="flex-1 min-w-0 rounded-none border-0 h-10 sm:h-12 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  onClick={() => router.push(item.path)}
                >
                  <span className="sm:mr-2 shrink-0">{item.icon}</span>
                  <span className="truncate ml-1 sm:ml-0">{item.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 