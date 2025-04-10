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
  const isLessonTimeActive = (startTime: string, endTime: string): boolean => {
    const lessonStartTime = new Date(startTime);
    const lessonEndTime = new Date(endTime);
    const now = new Date();
    
    // Create a time 2 minutes before the lesson start
    const twoMinutesBeforeStart = new Date(lessonStartTime);
    twoMinutesBeforeStart.setMinutes(twoMinutesBeforeStart.getMinutes() - 2);
    
    return now >= twoMinutesBeforeStart && now <= lessonEndTime;
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

  // Improved status indicators
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return <span className="w-2 h-2 bg-primary rounded-full inline-block mr-2"></span>;
      case 'completed':
        return <span className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-2"></span>;
      case 'cancelled':
        return <span className="w-2 h-2 bg-red-500 rounded-full inline-block mr-2"></span>;
      default:
        return <span className="w-2 h-2 bg-gray-400 rounded-full inline-block mr-2"></span>;
    }
  };

  // Cleaner status labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 'Planlandı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  // Format a time range (for displaying the lesson duration)
  const formatTimeRange = (startTime: string) => {
    const start = new Date(startTime);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 25);
    
    const formatOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
    return `${start.toLocaleTimeString('tr-TR', formatOpts)} - ${end.toLocaleTimeString('tr-TR', formatOpts)}`;
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
        <h1 className="text-3xl font-bold">Öğrenci Randevularım</h1>
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
                <Card key={booking.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 pt-4 px-5 border-b border-gray-100">
                    <div className="flex flex-wrap justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center text-lg">
                          {getStatusIndicator(booking.status)}
                          {booking.studentName || "Öğrenci"}
                        </CardTitle>
                        <div className="mt-1 text-sm font-medium text-primary">
                          {booking.field}
                        </div>
                      </div>
                      <div className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                        {formatTimeRange(booking.startTime)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="flex items-center mb-4">
                      <div className="text-base font-medium">
                        {formatDate(booking.startTime)}
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Öğrenci Notları</h3>
                        <p className="text-gray-600 text-sm">{booking.notes}</p>
                      </div>
                    )}
                    
                    {activeTab === 'upcoming' && !isLessonPast(booking.endTime) && (
                      <div className="mt-3">
                        {isLessonTimeActive(booking.startTime, booking.endTime) ? (
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90"
                            onClick={() => window.open(booking.meetLink, '_blank')}
                          >
                            <span className="flex items-center justify-center">
                              <span className="mr-2 relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                              </span>
                              Start Lesson
                            </span>
                          </Button>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md text-center">
                            <p className="text-sm text-gray-600">
                              Ders zamanı gelmeden 2 dakika önce buradan derse katılabilirsiniz.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeRange(booking.startTime)} saatleri arasında ders başlatma butonu aktif olacak
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  {activeTab === 'completed' && (
                    <CardFooter className="py-3 px-5 bg-gray-50 border-t border-gray-100">
                      <div className="text-xs text-gray-500 flex items-center">
                        {getStatusIndicator(booking.status)}
                        {booking.status === 'completed' ? "Ders tamamlandı" : 
                         booking.status === 'cancelled' ? "Ders iptal edildi" : getStatusLabel(booking.status)}
                      </div>
                    </CardFooter>
                  )}
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