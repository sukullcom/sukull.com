"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import GoogleMeetLinkManager from "./meet-link";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentRequests, setStudentRequests] = useState([]);

  // Check if the user is a teacher
  useEffect(() => {
    const checkTeacherStatus = async () => {
      try {
        const response = await fetch("/api/private-lesson/check-teacher-status");
        const data = await response.json();
        
        setIsTeacher(data.teacher);
        
        // If the user is a teacher, fetch their student requests
        if (data.teacher) {
          // This would be implemented in a real app to fetch actual student requests
          setStudentRequests([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setLoading(false);
      }
    };

    checkTeacherStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // If not a teacher, redirect to private lesson page
  if (!isTeacher) {
    router.push("/private-lesson");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Öğretmen Paneli</h1>
        
        {/* Google Meet Link Manager */}
        <GoogleMeetLinkManager />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
            <div className="space-y-4">
              <Link 
                href="/private-lesson/teacher-dashboard/availability" 
                className="flex items-center justify-between p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition"
              >
                <div>
                  <h3 className="font-medium">Müsait Olduğunuz Zamanları Belirleyin</h3>
                  <p className="text-sm text-gray-600">
                    Öğrencilerin seçebileceği ders saatlerinizi güncelleyin
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link 
                href="/private-lesson/teacher-dashboard/bookings" 
                className="flex items-center justify-between p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition"
              >
                <div>
                  <h3 className="font-medium">Dersleri Görüntüle</h3>
                  <p className="text-sm text-gray-600">
                    Planlanmış derslerinize göz atın
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Welcome Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Hoş Geldiniz!</h2>
            <p className="text-gray-600 mb-4">
              Bu panel üzerinden öğrencilerden gelen özel ders taleplerini görüntüleyebilir, 
              iletişim bilgilerine erişebilir ve derslerinizi organize edebilirsiniz.
            </p>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-medium">Başarılı Öğretmen İpuçları</h3>
                <p className="text-sm text-gray-600">
                  Öğrenci taleplerini hızlı yanıtlamak başarı oranınızı artırır.
                </p>
              </div>
              <Image
                src="/mascot_pink.svg"
                alt="Mascot"
                width={80}
                height={80}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Öğrenci Talepleri</h2>
          
          {studentRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Henüz yeni bir öğrenci talebi bulunmuyor.</p>
              <Image
                src="/empty_state.svg"
                alt="No requests"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* This would map through actual student requests in a real implementation */}
              {/* {studentRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{request.studentName}</h3>
                  <p className="text-sm text-gray-600">{request.field}</p>
                </div>
              ))} */}
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <Button
              variant="default"
              onClick={() => router.push("/private-lesson")}
            >
              Ana Sayfaya Dön
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 