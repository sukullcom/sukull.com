"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/app/types";

interface BookingResponse {
  bookings: Booking[];
  teacherMeetLink: string | null;
}

export default function TeacherBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const lessonsPerPage = 5;

  useEffect(() => {
    // Reset page when changing tabs
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("/api/private-lesson/teacher-bookings");
        
        if (!response.ok) {
          if (response.status === 403) {
            // Not a teacher, redirect to main page
            router.push("/private-lesson");
            return;
          }
          throw new Error("Failed to fetch bookings");
        }
        
        const data: BookingResponse = await response.json();
        
        // Make sure each booking has the meet link from the response
        const bookingsWithMeetLink = data.bookings.map((booking: Booking) => ({
          ...booking,
          meetLink: data.teacherMeetLink || booking.meetLink // Use the teacher's global meet link if available
        }));
        
        setBookings(bookingsWithMeetLink);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setError("Failed to load bookings. Please try again later.");
        setLoading(false);
      }
    };

    fetchBookings();
  }, [router]);

  // Helper functions
  // Check if a lesson is in the past
  const isLessonPast = (endTime: string): boolean => {
    const lessonEndTime = new Date(endTime);
    const now = new Date();
    return now > lessonEndTime;
  };

  // Add this function to check if the lesson time has arrived
  const isLessonTimeActive = (startTime: string): boolean => {
    const lessonTime = new Date(startTime);
    const now = new Date();
    return now >= lessonTime;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  };

  // Format time
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'confirmed':
        return 'Onaylandı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  // Separate bookings into upcoming and completed
  const upcomingBookings = bookings
    .filter(booking => !isLessonPast(booking.endTime) && booking.status !== 'cancelled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()); // Chronological order

  const completedBookings = bookings
    .filter(booking => isLessonPast(booking.endTime) || booking.status === 'completed' || booking.status === 'cancelled')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); // Most recent first

  // Get current lessons based on active tab and pagination
  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : completedBookings;
  const indexOfLastLesson = currentPage * lessonsPerPage;
  const indexOfFirstLesson = indexOfLastLesson - lessonsPerPage;
  const currentLessons = currentBookings.slice(indexOfFirstLesson, indexOfLastLesson);
  const totalPages = Math.ceil(currentBookings.length / lessonsPerPage);

  // Change page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={() => router.push("/private-lesson/teacher-dashboard")}>
            Öğretmen Paneline Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Derslerim</h1>
        <div className="flex gap-2">
          <Button variant="primaryOutline" onClick={() => router.push("/private-lesson/teacher-dashboard")}>
            Öğretmen Paneline Geri Dön
          </Button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Henüz Ders Kaydınız Yok</h2>
          <p className="text-gray-600 mb-6">Şu an için rezerve edilmiş ders bulunmuyor.</p>
        </div>
      ) : (
        <>
          {/* Tab navigation */}
          <div className="flex border-b mb-6">
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'upcoming' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Yaklaşan Dersler {upcomingBookings.length > 0 && `(${upcomingBookings.length})`}
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'completed' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
              onClick={() => setActiveTab('completed')}
            >
              Tamamlanan Dersler {completedBookings.length > 0 && `(${completedBookings.length})`}
            </button>
          </div>

          {currentLessons.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <h2 className="text-xl font-semibold mb-4">
                {activeTab === 'upcoming' ? 'Yaklaşan Ders Bulunamadı' : 'Tamamlanan Ders Bulunamadı'}
              </h2>
              <p className="text-gray-600 mb-6">
                {activeTab === 'upcoming' 
                  ? 'Şu an için planlanmış yaklaşan ders bulunmuyor.' 
                  : 'Henüz tamamlanmış ders bulunmuyor.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentLessons.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50">
                    <div className="flex flex-wrap justify-between items-center">
                      <div>
                        <CardTitle>{booking.studentName}</CardTitle>
                        <CardDescription>{booking.studentEmail}</CardDescription>
                        {booking.studentUsername && (
                          <CardDescription className="text-sm text-gray-600">
                            Kullanıcı Adı: {booking.studentUsername}
                          </CardDescription>
                        )}
                        <div className="mt-1 text-sm font-medium text-primary">
                          Alan: {booking.field}
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Tarih</h3>
                        <p className="mt-1">{formatDate(booking.startTime)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Saat</h3>
                        <p className="mt-1">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500">Derse Katıl</h3>
                        <div className="mt-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => window.open(booking.meetLink || '#', '_blank')}
                            disabled={!booking.meetLink || !isLessonTimeActive(booking.startTime) || isLessonPast(booking.endTime) || booking.status === 'cancelled'}
                            className={(!booking.meetLink || !isLessonTimeActive(booking.startTime) || isLessonPast(booking.endTime) || booking.status === 'cancelled') ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            {isLessonPast(booking.endTime) 
                              ? "Ders Tamamlandı" 
                              : !booking.meetLink
                                ? "Meet Linki Ayarlanmamış"
                              : isLessonTimeActive(booking.startTime) 
                                ? "Google Meet ile Derse Başla" 
                                : `Ders ${formatTime(booking.startTime)}'de Başlayacak`}
                          </Button>
                        </div>
                      </div>
                      {booking.notes && (
                        <div className="md:col-span-2">
                          <h3 className="text-sm font-medium text-gray-500">Notlar</h3>
                          <p className="mt-1 text-gray-700">{booking.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t">
                    <div className="text-xs text-gray-500">
                      Rezervasyon tarihi: {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {currentBookings.length > lessonsPerPage && (
            <div className="flex justify-center mt-6 gap-2">
              <Button
                variant="primaryOutline"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}
              >
                Önceki
              </Button>
              <div className="flex items-center px-4">
                Sayfa {currentPage} / {totalPages}
              </div>
              <Button
                variant="primaryOutline"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}
              >
                Sonraki
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 