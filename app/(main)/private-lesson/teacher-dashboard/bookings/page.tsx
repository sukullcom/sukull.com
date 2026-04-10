"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLessonStatusUpdater } from "@/hooks/use-lesson-status-updater";
import { CancelLessonModal } from "@/components/modals/cancel-lesson-modal";
import { LoadingSpinner } from "@/components/loading-spinner";
import { toast } from "sonner";

interface Booking {
  id: number;
  studentId: string;
  teacherId: string;
  field: string;
  fields?: string[];
  startTime: string;
  endTime: string;
  status: string;
  meetLink?: string;
  notes?: string;
  teacherJoinedAt?: string | null;
  earningsAmount?: number | null;
  createdAt: string;
  studentName: string;
  studentEmail: string;
  studentUsername: string;
}

// Helper function to extract simplified field names
const getSimplifiedField = (fields?: string[], fallbackField?: string): string => {
  if (fields && fields.length > 0) {
    // Extract unique subject names from fields array
    const subjects = fields.map(field => {
      // Remove grade information (like "5.sınıf", "6.sınıf", etc.)
      return field.replace(/\s*\d+\.?\s*(sınıf|Sınıf)/g, '').trim();
    });
    
    // Get unique subjects
    const uniqueSubjects = Array.from(new Set(subjects));
    return uniqueSubjects.join(', ');
  }
  
  // Fallback to single field, also cleaned
  if (fallbackField) {
    return fallbackField.replace(/\s*\d+\.?\s*(sınıf|Sınıf)/g, '').trim();
  }
  
  return "Belirtilmemiş";
};

export default function TeacherBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [teacherMeetLink, setTeacherMeetLink] = useState<string | null>(null);
  const [joiningLessonId, setJoiningLessonId] = useState<number | null>(null);
  const [cancellingLessonId, setCancellingLessonId] = useState<number | null>(null);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    bookingId: number | null;
    studentName: string;
    lessonTime: string;
    isLoading: boolean;
  }>({ isOpen: false, bookingId: null, studentName: "", lessonTime: "", isLoading: false });
  const lessonsPerPage = 5;
  
  // Use the lesson status updater hook to automatically update completed lessons
  useLessonStatusUpdater();

  useEffect(() => {
    // Reset page when changing tabs
    setCurrentPage(1);
  }, [activeTab]);

  // Listen for lesson status updates
  useEffect(() => {
    const handleLessonStatusUpdate = () => {
      fetchBookings();
    };

    window.addEventListener('lessonStatusUpdated', handleLessonStatusUpdate);
    
    return () => {
      window.removeEventListener('lessonStatusUpdated', handleLessonStatusUpdate);
    };
  }, []);

  const handleJoinLesson = async (booking: Booking) => {
    setJoiningLessonId(booking.id);
    try {
      const res = await fetch("/api/private-lesson/teacher-join-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();

      if (!res.ok && res.status !== 200) {
        toast.error(data.message || "Derse katılım kaydedilemedi");
        return;
      }

      setBookings(prev => prev.map(b =>
        b.id === booking.id ? { ...b, teacherJoinedAt: new Date().toISOString() } : b
      ));

      const meetUrl = data.meetLink || booking.meetLink || teacherMeetLink;
      if (meetUrl) {
        window.open(meetUrl, "_blank");
      }
    } catch {
      toast.error("Derse katılım kaydedilirken bir hata oluştu");
    } finally {
      setJoiningLessonId(null);
    }
  };

  const handleCancelLesson = (bookingId: number) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    setCancelModal({
      isOpen: true,
      bookingId,
      studentName: booking.studentName || "Öğrenci",
      lessonTime: `${formatDate(booking.startTime)} ${formatTimeRange(booking.startTime)}`,
      isLoading: false,
    });
  };

  const confirmCancelLesson = async () => {
    if (!cancelModal.bookingId) return;
    setCancelModal((prev) => ({ ...prev, isLoading: true }));
    setCancellingLessonId(cancelModal.bookingId);
    try {
      const res = await fetch(`/api/private-lesson/cancel-lesson/${cancelModal.bookingId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Ders iptal edilemedi");
        setCancelModal((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === cancelModal.bookingId ? { ...b, status: "cancelled" } : b))
      );
      toast.success(data.message || "Ders başarıyla iptal edildi");
      setCancelModal({ isOpen: false, bookingId: null, studentName: "", lessonTime: "", isLoading: false });
    } catch {
      toast.error("Ders iptal edilirken bir hata oluştu");
      setCancelModal((prev) => ({ ...prev, isLoading: false }));
    } finally {
      setCancellingLessonId(null);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/private-lesson/teacher-bookings");
      
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      
      const data = await response.json();
      
      // Extract bookings array from the response
      const bookingsArray = data.bookings || [];
      setBookings(bookingsArray);
      setTeacherMeetLink(data.teacherMeetLink);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Dersleriniz yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Helper functions
  // Check if a lesson is in the past
  const isLessonPast = (endTime: string): boolean => {
    const lessonEndTime = new Date(endTime);
    const now = new Date();
    return now > lessonEndTime;
  };

  const isLessonTimeActive = (startTime: string, endTime: string): boolean => {
    const lessonStartTime = new Date(startTime);
    const lessonEndTime = new Date(endTime);
    const now = new Date();
    
    const twoMinutesBefore = new Date(lessonStartTime);
    twoMinutesBefore.setMinutes(twoMinutesBefore.getMinutes() - 2);
    
    return now >= twoMinutesBefore && now <= lessonEndTime;
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

  // Format time range to show both start and end times
  const formatTimeRange = (startTimeString: string) => {
    const startTime = new Date(startTimeString);
    const endTime = new Date(new Date(startTimeString).getTime() + 25 * 60000); // 25 minutes later
    
    return `${startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${endTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  // Get status indicator
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2" />;
      case 'confirmed':
        return <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2" />;
      case 'completed':
        return <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2" />;
      case 'cancelled':
        return <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-2" />;
      default:
        return <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2" />;
    }
  };

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
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Tekrar Dene</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 pb-10">
      {bookings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">Şu an için rezerve edilmiş ders bulunmuyor.</p>
        </div>
      ) : (
        <>
          {/* Tab navigation */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-6">
            <button
              className={`flex-1 rounded-lg py-2.5 px-3 text-sm font-semibold transition-all ${activeTab === 'upcoming' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Yaklaşan {upcomingBookings.length > 0 && `(${upcomingBookings.length})`}
            </button>
            <button
              className={`flex-1 rounded-lg py-2.5 px-3 text-sm font-semibold transition-all ${activeTab === 'completed' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('completed')}
            >
              Tamamlanan {completedBookings.length > 0 && `(${completedBookings.length})`}
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
                  <CardHeader className="pb-3 pt-4 px-4 sm:px-5 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <CardTitle className="flex items-center text-base sm:text-lg">
                          {getStatusIndicator(booking.status)}
                          {booking.studentName || "Öğrenci"}
                        </CardTitle>
                        <div className="mt-1 text-sm font-medium text-primary">
                          {getSimplifiedField(booking.fields, booking.field)}
                        </div>
                      </div>
                      <div className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary w-fit">
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
                          <div className="space-y-2">
                            <Button 
                              variant="primary"
                              size="lg" 
                              onClick={() => handleJoinLesson(booking)}
                              disabled={joiningLessonId === booking.id}
                              className="w-full font-medium"
                            >
                              <span className="flex items-center justify-center">
                                {joiningLessonId === booking.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <span className="mr-2 relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    {booking.teacherJoinedAt ? "Derse Tekrar Katıl" : "Derse Başla"}
                                  </>
                                )}
                              </span>
                            </Button>
                            {booking.teacherJoinedAt && (
                              <p className="text-xs text-green-600 text-center font-medium">
                                ✓ Katılımınız kaydedildi
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-md text-center">
                              <p className="text-sm text-gray-600">
                                Ders zamanı gelmeden 2 dakika önce buradan derse katılabilirsiniz.
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTimeRange(booking.startTime)} saatleri arasında ders başlatma butonu aktif olacak
                              </p>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleCancelLesson(booking.id)}
                              disabled={cancellingLessonId === booking.id}
                              className="w-full"
                            >
                              {cancellingLessonId === booking.id ? "İptal ediliyor..." : "Dersi İptal Et"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  {activeTab === 'completed' && (
                    <CardFooter className="py-3 px-5 bg-gray-50 border-t border-gray-100">
                      <div className="w-full flex items-center justify-between">
                        <div className="text-xs text-gray-500 flex items-center">
                          {getStatusIndicator(booking.status)}
                          Ders tamamlandı
                        </div>
                        {booking.teacherJoinedAt ? (
                          <div className="text-sm font-semibold text-green-600">
                            +₺{booking.earningsAmount ?? 0}
                          </div>
                        ) : (
                          <div className="text-xs text-red-500">
                            Katılım kaydı yok
                          </div>
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
        onClose={() => setCancelModal({ isOpen: false, bookingId: null, studentName: "", lessonTime: "", isLoading: false })}
        onConfirm={confirmCancelLesson}
        teacherName={cancelModal.studentName}
        lessonTime={cancelModal.lessonTime}
        isLoading={cancelModal.isLoading}
      />
    </div>
  );
} 