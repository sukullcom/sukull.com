"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// User status check component that redirects to appropriate page
export default function PrivateLessonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatusAndRedirect = async () => {
      try {
        // Check teacher status
        const teacherResponse = await fetch("/api/private-lesson/check-teacher-status");
        const teacherData = await teacherResponse.json();
        
        // Check student status
        const studentResponse = await fetch("/api/private-lesson/check-student-status");
        const studentData = await studentResponse.json();
        
        // Redirect based on user status
        if (teacherData.teacher) {
          router.push("/private-lesson/teacher-dashboard/bookings");
        } else if (studentData.student) {
          router.push("/private-lesson/my-bookings");
        } else {
          // If neither teacher nor student, stay on this page and show application options
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        setLoading(false);
      }
    };

    checkUserStatusAndRedirect();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Only show this UI if user is neither a teacher nor a student
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10">Özel Dersler</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-semibold mb-4">Öğretmen Olmak İster misiniz?</h2>
            <p className="text-gray-600 mb-6">
              Bilgi ve deneyiminizi paylaşın, öğrencilere yardımcı olun ve ek gelir elde edin.
            </p>
            <button 
              onClick={() => window.location.href="/private-lesson/give"}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Öğretmen Başvurusu Yap
            </button>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-semibold mb-4">Ders Almak İster misiniz?</h2>
            <p className="text-gray-600 mb-6">
              Alanında uzman öğretmenlerden özel ders alarak akademik başarınızı artırın.
            </p>
            <button 
              onClick={() => window.location.href="/private-lesson/get"}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Öğrenci Başvurusu Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
