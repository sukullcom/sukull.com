"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReservationModal } from "@/components/modals/reservation-modal";
import { Star } from "lucide-react";
import { toast } from "sonner";
import UserCreditsDisplay from "@/components/user-credits-display";

interface Teacher {
  id: string;
  name: string;
  email: string;
  bio?: string;
  meetLink?: string;
  avatar?: string;
  field?: string;
  fields?: string[];
  averageRating?: number;
  totalReviews?: number;
}

interface AvailabilityData {
  id: number;
  teacherId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  weekStartDate: string;
  createdAt: string;
  updatedAt: string;
}

interface BookedSlotData {
  id: number;
  studentId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  status: string;
  meetLink?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  dayOfWeek: number;
  isBooked?: boolean;
}

interface SelectedSlot {
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  student: {
    name: string;
  };
}

export default function TeacherDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch teacher details and availability
        const response = await fetch(`/api/private-lesson/teacher-details/${params.id}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Handle different error status codes
          if (response.status === 403) {
            toast.error("Only approved students can view teacher details");
            router.push("/private-lesson");
            return;
          } else if (response.status === 404) {
            setError("Teacher not found");
          } else {
            const errorMessage = errorData.error || errorData.message || response.statusText;
            setError(`Failed to fetch teacher details: ${errorMessage}`);
          }
          throw new Error(`Failed to fetch teacher details: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.teacher) {
          setError("Invalid teacher data received");
          setLoading(false);
          return;
        }
        
        setTeacher(data.teacher);
        
        // Ensure availability is always an array
        const availabilityData = Array.isArray(data.availability) ? data.availability : [];
        
        // Get booked slots data - ensure it's always an array
        const bookedSlotsData = Array.isArray(data.bookedSlots) ? data.bookedSlots : [];
        
        // Convert availability data and mark booked slots instead of filtering them out
        const processedAvailability = availabilityData
          .map((slot: AvailabilityData) => {
            const timeSlot: TimeSlot = {
              ...slot,
              startTime: new Date(slot.startTime),
              endTime: new Date(slot.endTime),
              isBooked: false
            };
            
            // Check if this slot is booked
            const isBooked = bookedSlotsData.some((bookedSlot: BookedSlotData) => {
              const bookedStart = new Date(bookedSlot.startTime);
              const bookedEnd = new Date(bookedSlot.endTime);
              return timeSlot.startTime.getTime() === bookedStart.getTime() &&
                     timeSlot.endTime.getTime() === bookedEnd.getTime();
            });
            
            timeSlot.isBooked = isBooked;
            return timeSlot;
          });
        
        setAvailability(processedAvailability);
        
        // Fetch teacher reviews
        try {
          const reviewsResponse = await fetch(`/api/private-lesson/teacher-details/${params.id}/reviews`);
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            setReviews(reviewsData.reviews || []);
            // Update teacher with review stats if available
            if (reviewsData.averageRating !== undefined) {
              setTeacher(prev => prev ? {
                ...prev,
                averageRating: reviewsData.averageRating,
                totalReviews: reviewsData.totalReviews
              } : prev);
            }
          }
        } catch (reviewError) {
          console.error("Error fetching reviews:", reviewError);
          // Continue without reviews
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching teacher details:", error);
        setError("An error occurred while loading teacher details");
        setLoading(false);
      }
    };

    fetchTeacherDetails();
  }, [params.id, router]);

  const handleSlotSelect = (slot: TimeSlot) => {
    // Don't allow selection of booked slots - no toast error, just ignore
    if (slot.isBooked) {
      return;
    }
    
    setSelectedSlot({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    setShowReservationModal(true);
  };

  const handleBookLesson = async () => {
    if (!selectedSlot || !teacher) return;
    
    setBooking(true);
    try {
      const response = await fetch("/api/private-lesson/book-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacher.id,
          startTime: selectedSlot.startTime.toISOString(),
          endTime: selectedSlot.endTime.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Ders başarıyla rezerve edildi!");
        setShowReservationModal(false);
        setSelectedSlot(null);
        
        // Refresh availability to reflect the new booking
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to book lesson");
      }
    } catch (error) {
      console.error("Error booking lesson:", error);
      toast.error(error instanceof Error ? error.message : "Ders rezerve edilirken bir hata oluştu");
    } finally {
      setBooking(false);
    }
  };

  // Rest of the component remains the same...
  const getDayName = (dayOfWeek: number): string => {
    const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    return days[dayOfWeek] || "Bilinmeyen";
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sortDaysByCurrentDay = (dayNumbers: string[]): string[] => {
    const currentDay = new Date().getDay();
    return dayNumbers.sort((a, b) => {
      const dayA = parseInt(a);
      const dayB = parseInt(b);
      
      const adjustedA = dayA >= currentDay ? dayA - currentDay : dayA + 7 - currentDay;
      const adjustedB = dayB >= currentDay ? dayB - currentDay : dayB + 7 - currentDay;
      
      return adjustedA - adjustedB;
    });
  };

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

  const formatReviewDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error || "Teacher not found"}</p>
          <Button onClick={() => router.push("/private-lesson/teachers")}>
            Go Back to Teachers
          </Button>
        </div>
      </div>
    );
  }

  // Group availability by day
  const availabilityByDay: { [key: number]: TimeSlot[] } = {};
  
  availability.forEach(slot => {
    if (!availabilityByDay[slot.dayOfWeek]) {
      availabilityByDay[slot.dayOfWeek] = [];
    }
    availabilityByDay[slot.dayOfWeek].push(slot);
  });

  // Sort days to start with the current day
  const sortedDays = sortDaysByCurrentDay(Object.keys(availabilityByDay));

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">{teacher.name}</h1>

      {/* User Credits Display */}
      <UserCreditsDisplay className="mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Teacher profile */}
        <Card className="md:col-span-1 bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-center mb-4">
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-primary/20">
                <Image
                  src={teacher.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teacher.name)}`}
                  alt={teacher.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">{teacher.name}</CardTitle>
            
            {/* Display fields as badges */}
            {(teacher.fields && teacher.fields.length > 0) ? (
              <div className="flex flex-wrap gap-1 justify-center mt-3">
                {teacher.fields.map((field, index) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 text-sm bg-primary/10 text-primary rounded-full font-medium"
                  >
                    {field}
                  </span>
                ))}
              </div>
            ) : teacher.field ? (
              <CardDescription className="text-center font-medium text-primary text-base mt-1">
                {teacher.field}
              </CardDescription>
            ) : null}
            
            {/* Rating Display */}
            {teacher.averageRating && teacher.averageRating > 0 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex">
                  {renderStars(Math.round(teacher.averageRating))}
                </div>
                <span className="text-sm text-gray-600">
                  {teacher.averageRating.toFixed(1)} ({teacher.totalReviews} değerlendirme)
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-2 text-gray-800">Biyografi</h3>
                <p className="text-gray-700 leading-relaxed">
                  {teacher.bio || "Bu öğretmen henüz kendisi hakkında bilgi paylaşmamış."}
                </p>
              </div>

              {/* Reviews Section */}
              <div className="p-4 rounded-lg border-t">
                <h3 className="font-medium text-lg mb-3 text-gray-800">Değerlendirmeler</h3>
                {reviews.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {reviews.slice(0, 5).map((review: Review, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{review.student?.name || "Anonim"}</span>
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 mb-1">&ldquo;{review.comment}&rdquo;</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatReviewDate(review.createdAt)}
                        </p>
                      </div>
                    ))}
                    {reviews.length > 5 && (
                      <p className="text-center text-sm text-gray-500 mt-2">
                        ve {reviews.length - 5} değerlendirme daha...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">Henüz Değerlendirme Yok</p>
                    <p className="text-sm mt-1">Bu öğretmen henüz hiç değerlendirme almamış.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability and booking */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Müsait Zamanlar</CardTitle>
              <CardDescription>
                Aşağıdaki zamanlardan birini seçerek ders rezerve edebilirsiniz
              </CardDescription>
              {/* Legend */}
              <div className="flex items-center gap-4 text-sm mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-200 bg-white rounded"></div>
                  <span className="text-gray-600">Müsait</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
                  <span className="text-gray-600">Dolu</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {availability.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  Bu öğretmenin şu an müsait zamanı bulunmuyor.
                </p>
              ) : (
                <div className="space-y-4">
                  {sortedDays.map((dayStr) => {
                    const dayNumber = parseInt(dayStr);
                    const daySlots = availabilityByDay[dayNumber] || [];
                    
                    return (
                      <div key={dayNumber} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 text-gray-800">
                          {getDayName(dayNumber)}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {daySlots.map((slot, index) => (
                            <Button
                              key={index}
                              variant={slot.isBooked ? "default" : "secondaryOutline"}
                              size="sm"
                              onClick={() => handleSlotSelect(slot)}
                              disabled={slot.isBooked}
                              className={`text-sm py-2 transition-all ${
                                slot.isBooked 
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 opacity-60 hover:bg-gray-100 hover:text-gray-400" 
                                  : "hover:bg-green-50 border-green-200 text-green-700 hover:border-green-300 cursor-pointer"
                              }`}
                            >
                              {formatTime(slot.startTime)}
                              {slot.isBooked}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={showReservationModal}
        onClose={() => {
          setShowReservationModal(false);
          setSelectedSlot(null);
        }}
        onConfirm={handleBookLesson}
        teacherName={teacher.name}
        selectedSlot={selectedSlot}
        isLoading={booking}
      />
    </div>
  );
} 