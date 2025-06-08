"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  User,
  Users,
  GraduationCap,
  BookOpen,
  Loader2
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
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
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
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            {/* Role Badge */}
            <div className="hidden md:flex items-center gap-2">
              <div className={`p-2 rounded-full ${userStatus.isTeacher ? 'bg-green-100' : 'bg-blue-100'}`}>
                {userStatus.isTeacher ? (
                  <GraduationCap className={`w-5 h-5 ${userStatus.isTeacher ? 'text-green-600' : 'text-blue-600'}`} />
                ) : (
                  <BookOpen className={`w-5 h-5 ${userStatus.isTeacher ? 'text-green-600' : 'text-blue-600'}`} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">
                  {userStatus.isTeacher ? "Öğretmen Paneli" : "Öğrenci Paneli"}
                </span>
                <span className="text-xs text-gray-500">Özel Ders Platformu</span>
              </div>
            </div>

            {/* Mobile Role Indicator */}
            <div className="md:hidden">
              <Badge variant={userStatus.isTeacher ? "default" : "secondary"} className="text-xs">
                {userStatus.isTeacher ? "Öğretmen" : "Öğrenci"}
              </Badge>
            </div>

            {/* Navigation Items */}
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Button
                    key={item.path}
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    onClick={() => router.push(item.path)}
                    className={`
                      group relative flex items-center gap-2 transition-all duration-200
                      ${active 
                        ? userStatus.isTeacher 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className={`
                      transition-transform duration-200
                      ${active ? 'scale-110' : 'group-hover:scale-110'}
                    `}>
                      {item.icon}
                    </span>
                    <span className="hidden sm:inline font-medium">{item.name}</span>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
                      <Card className="px-3 py-2 shadow-lg border">
                        <p className="text-xs text-gray-600 whitespace-nowrap">{item.description}</p>
                      </Card>
                    </div>
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Quick Stats (Desktop Only) */}
          <div className="hidden lg:flex items-center gap-4">
            {userStatus.isTeacher && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">Aktif</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  3 Randevu Bugün
                </Badge>
              </>
            )}
            {userStatus.isStudent && (
              <Badge variant="outline" className="text-xs">
                <BookOpen className="w-3 h-3 mr-1" />
                2 Yaklaşan Ders
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 