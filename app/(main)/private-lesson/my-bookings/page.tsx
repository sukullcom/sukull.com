"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CancelLessonModal } from "@/components/modals/cancel-lesson-modal";
import { ReviewLessonModal } from "@/components/modals/review-lesson-modal";
import { Star } from "lucide-react";
import { toast } from "sonner";
import UserCreditsDisplay from "@/components/user-credits-display";

interface Booking {
  id: number;
  studentId: string;
  teacherId: string;
  field: string;
  startTime: string;
  endTime: string;
  status: string;
  meetLink?: string;
  notes?: string;
  createdAt: string;
  teacher: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    meetLink?: string;
  };
  review?: {
    id: number;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
}

interface ReviewData {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

// Countdown timer hook - moved outside of component to avoid conditional calling
const useCountdown = (targetDate: Date) => {
  const [countdown, setCountdown] = useState({
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        clearInterval(intervalId);
        setCountdown({ minutes: 0, seconds: 0 });
        return;
      }
      
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setCountdown({ minutes, seconds });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [targetDate]);
  
  return countdown;
};

// Create a separate component to use the useCountdown hook consistently
function LessonCountdown({ lessonStart }: { lessonStart: Date }) {
  const countdown = useCountdown(lessonStart);
  
  return (
    <div className="text-center mb-2">
      <p className="text-sm text-primary font-medium">
        Derse başlamasına: {String(countdown.minutes).padStart(2, '0')}
      </p>
    </div>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    bookingId: number | null;
    teacherName: string;
    lessonTime: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    bookingId: null,
    teacherName: '',
    lessonTime: '',
    isLoading: false
  });

  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    bookingId: number | null;
    teacherId: string;
    teacherName: string;
    lessonDate: string;
  }>({
    isOpen: false,
    bookingId: null,
    teacherId: '',
    teacherName: '',
    lessonDate: '',
  });
  const lessonsPerPage = 10;

  useEffect(() => {
    // Reset page when changing tabs
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("/api/private-lesson/student-bookings");
        
        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }
        
        const data = await response.json();
        
        // Extract bookings array from the response
        const bookingsArray = data.bookings || [];
        
        // Make sure each booking has a teacher object
        const bookingsWithTeacher = bookingsArray.map((booking: Booking) => {
          if (!booking.teacher) {
            booking.teacher = { name: "Unknown Teacher", id: "", email: "" };
          }
          return booking;
        });
        
        setBookings(bookingsWithTeacher);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setError("Failed to load bookings. Please try again later.");
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Helper functions
  // Check if a lesson is in the past
  const isLessonPast = (endTime: string): boolean => {
    const lessonEndTime = new Date(endTime);
    const now = new Date();
    return now > lessonEndTime;
  };

  // Check if the lesson time has arrived (now is within 2 minutes before start time and end time)
  const isLessonTimeActive = (startTime: string, endTime: string): boolean => {
    const lessonStartTime = new Date(startTime);
    const lessonEndTime = new Date(endTime);
    const now = new Date();
    
    // Create a time 2 minutes before the lesson start
    const twoMinutesBeforeStart = new Date(lessonStartTime);
    twoMinutesBeforeStart.setMinutes(twoMinutesBeforeStart.getMinutes() - 2);
    
    return now >= twoMinutesBeforeStart && now <= lessonEndTime;
  };

  // Check if a lesson can be cancelled (more than 24 hours before start)
  const canCancelLesson = (startTime: string): boolean => {
    const lessonStart = new Date(startTime);
    const now = new Date();
    const timeDiff = lessonStart.getTime() - now.getTime();
    
    // Return true if more than 24 hours (86400000 ms) before the lesson
    return timeDiff > 86400000;
  };

  // Handle lesson cancellation
  const handleCancelLesson = async (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    setCancelModal({
      isOpen: true,
      bookingId,
      teacherName: booking.teacher?.name || 'Öğretmen',
      lessonTime: formatDate(booking.startTime) + ' ' + formatTimeRange(booking.startTime),
      isLoading: false
    });
  };

  const confirmCancelLesson = async () => {
    if (!cancelModal.bookingId) return;

    setCancelModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch(`/api/private-lesson/cancel-lesson/${cancelModal.bookingId}`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("İptal işlemi başarısız oldu.");
      }
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === cancelModal.bookingId ? { ...booking, status: 'cancelled' } : booking
      ));
      
      // Close modal and show success
      setCancelModal({
        isOpen: false,
        bookingId: null,
        teacherName: '',
        lessonTime: '',
        isLoading: false
      });
      
      // Show success toast instead of alert
      toast.success('Ders başarıyla iptal edildi ve krediniz iade edildi');
    } catch (error) {
      console.error("Error cancelling lesson:", error);
      setCancelModal(prev => ({ ...prev, isLoading: false }));
      toast.error('Ders iptal edilemedi. Lütfen daha sonra tekrar deneyin');
    }
  };

  const closeCancelModal = () => {
    setCancelModal({
      isOpen: false,
      bookingId: null,
      teacherName: '',
      lessonTime: '',
      isLoading: false
    });
  };

  // Handle review lesson
  const handleReviewLesson = async (bookingId: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    setReviewModal({
      isOpen: true,
      bookingId,
      teacherId: booking.teacherId,
      teacherName: booking.teacher?.name || 'Öğretmen',
      lessonDate: formatDate(booking.startTime),
    });
  };

  const closeReviewModal = () => {
    setReviewModal({
      isOpen: false,
      bookingId: null,
      teacherId: '',
      teacherName: '',
      lessonDate: '',
    });
  };

  const handleReviewSubmitted = (review: ReviewData) => {
    // Update the booking with the new review
    setBookings(prev => prev.map(booking => 
      booking.id === reviewModal.bookingId 
        ? { ...booking, review } 
        : booking
    ));
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return 'Bugün';
    } else if (isTomorrow) {
      return 'Yarın';
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      });
    }
  };

  // Format time
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false // 24-hour format
    });
  };

  // Format time for display - always show 25 minutes duration
  const formatTimeRange = (startTimeString: string) => {
    const startTime = new Date(startTimeString);
    
    // Create end time as 25 minutes after start time
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 25);
    
    const formattedStartTime = startTime.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    
    const formattedEndTime = endTime.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    
    return `${formattedStartTime}-${formattedEndTime}`;
  };

  // Improved status display with simpler indicators
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



  // Render stars for reviews
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  // Create a new component for the upcoming lesson button with countdown
  function UpcomingLessonButton({ 
    booking, 
    formatTime
  }: { 
    booking: Booking;
    formatTime: (timeString: string) => string;
  }) {
    const lessonStart = new Date(booking.startTime);
    const now = new Date();
    const timeUntilLesson = lessonStart.getTime() - now.getTime();
    const isStartingSoon = timeUntilLesson <= 60 * 60 * 1000; // 1 hour or less
    
    // Check if lesson is active or in the past
    const active = isLessonTimeActive(booking.startTime, booking.endTime);
    const past = isLessonPast(booking.endTime);
    const cancelled = booking.status === 'cancelled';
    
    // If lesson is active (and not past or cancelled), show join button
    if (active && !past && !cancelled) {
      return (
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => window.open(booking.meetLink || booking.teacher?.meetLink, '_blank')}
          className="w-full font-medium"
        >
          <span className="flex items-center justify-center">
            <span className="mr-2 relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Derse Başla
          </span>
        </Button>
      );
    }
    
    // Show cancel button if lesson can be cancelled (more than 24 hours before)
    if (!past && !cancelled && canCancelLesson(booking.startTime)) {
      return (
        <div className="space-y-3">
          {isStartingSoon && (
            <LessonCountdown lessonStart={lessonStart} />
          )}
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm"
              disabled
              className="flex-1 opacity-70"
            >
              Ders {formatTime(booking.startTime)}&apos;de Başlayacak
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => handleCancelLesson(booking.id)}
              className="flex-shrink-0"
            >
              İptal Et
            </Button>
          </div>
          <div className="text-xs text-gray-500 italic text-center">
            Dersi iptal etmek için 24 saaten fazla süreniz var
          </div>
        </div>
      );
    }
    
    // If not active yet but cancellation period has passed
    if (!past && !cancelled) {
      const lessonStartTime = new Date(booking.startTime);
      const twoMinutesBeforeStart = new Date(lessonStartTime);
      twoMinutesBeforeStart.setMinutes(twoMinutesBeforeStart.getMinutes() - 2);
      const timeUntilActive = twoMinutesBeforeStart.getTime() - now.getTime();
      const minutesUntilActive = Math.floor(timeUntilActive / (1000 * 60));
      
      return (
        <>
          {isStartingSoon && (
            <LessonCountdown lessonStart={lessonStart} />
          )}
          <div className="space-y-2">
            <Button 
              variant="default" 
              size="sm"
              disabled
              className="w-full opacity-70"
            >
              Ders {formatTime(booking.startTime)}&apos;de Başlayacak
            </Button>
            <div className="text-xs text-gray-500 text-center">
              {minutesUntilActive > 0 
                ? `Derse katılma butonu ${minutesUntilActive} dakika içinde aktif olacak` 
                : 'Derse katılma butonu çok yakında aktif olacak'}
            </div>
            <div className="text-xs text-red-500 text-center">
              Derse 24 saatten az kaldığı için iptal edilemez
            </div>
          </div>
        </>
      );
    }
    
    // Don't show anything for past or cancelled lessons
    return null;
  }

  // Separate bookings into upcoming and completed
  const upcomingBookings = bookings
    .filter(booking => !isLessonPast(booking.endTime) && booking.status !== 'cancelled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()); // Chronological order

  const completedBookings = bookings
    .filter(booking => (isLessonPast(booking.endTime) || booking.status === 'completed') && booking.status !== 'cancelled')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); // Most recent first

  // Get current lessons based on active tab and pagination
  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : completedBookings;
  const indexOfLastLesson = currentPage * lessonsPerPage;
  const indexOfFirstLesson = indexOfLastLesson - lessonsPerPage;
  const currentLessons = currentBookings.slice(indexOfFirstLesson, indexOfLastLesson);
  const totalPages = Math.ceil(currentBookings.length / lessonsPerPage);

  // Pagination functions
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
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tekrar Dene
        </Button>
      </div>
    );
  }

  if (!upcomingBookings.length && !completedBookings.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Henüz bir ders rezervasyonunuz yok</h1>
        <Button onClick={() => router.push("/private-lesson/teachers")}>
          Bir Ders Rezerve Et
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      {/* User Credits Display */}
      <UserCreditsDisplay className="mb-6" />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Derslerim</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Henüz Ders Kaydınız Yok</h2>
          <p className="text-gray-600 mb-6">Şu an için rezerve edilmiş ders bulunmuyor.</p>
          <Button variant="primary" onClick={() => router.push("/private-lesson/teachers")}>
            Ders Rezerve Et
          </Button>
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
              {activeTab === 'upcoming' && (
                <Button variant="primary" onClick={() => router.push("/private-lesson/teachers")}>
                  Ders Rezerve Et
                </Button>
              )}
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
                          {booking.teacher?.name || "Öğretmen"}
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
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Notlar</h3>
                        <p className="text-gray-600 text-sm">{booking.notes}</p>
                      </div>
                    )}
                    
                    {activeTab === 'upcoming' && (
                      <div className="mt-3">
                        <UpcomingLessonButton 
                          booking={booking} 
                          formatTime={formatTime}
                        />
                      </div>
                    )}
                  </CardContent>
                  {activeTab === 'completed' && (
                    <CardFooter className="py-4 px-5 bg-gray-50 border-t border-gray-100">
                      <div className="w-full space-y-3">
                        <div className="text-xs text-gray-500 flex items-center">
                          {getStatusIndicator(booking.status)}
                          Ders tamamlandı
                        </div>
                        
                        {booking.review ? (
                          // Show existing review
                          <div className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Değerlendirmeniz</span>
                              <div className="flex items-center gap-1">
                                {renderStars(booking.review.rating)}
                                <span className="text-sm text-gray-600 ml-1">
                                  ({booking.review.rating}/5)
                                </span>
                              </div>
                            </div>
                            {booking.review.comment && (
                              <p className="text-sm text-gray-600 mt-1">
                                &ldquo;{booking.review.comment}&rdquo;
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(booking.review.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        ) : (
                          // Show review button for lessons without reviews
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewLesson(booking.id)}
                            className="w-full"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Dersi Değerlendir
                          </Button>
                        )}
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

      <CancelLessonModal
        isOpen={cancelModal.isOpen}
        onClose={closeCancelModal}
        onConfirm={confirmCancelLesson}
        teacherName={cancelModal.teacherName}
        lessonTime={cancelModal.lessonTime}
        isLoading={cancelModal.isLoading}
      />

      <ReviewLessonModal
        isOpen={reviewModal.isOpen}
        onClose={closeReviewModal}
        bookingId={reviewModal.bookingId || 0}
        teacherId={reviewModal.teacherId}
        teacherName={reviewModal.teacherName}
        lessonDate={reviewModal.lessonDate}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
} 