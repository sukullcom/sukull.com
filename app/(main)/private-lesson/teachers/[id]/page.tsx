"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Teacher {
  id: string;
  name: string;
  email: string;
  bio?: string;
  meetLink?: string;
  avatar?: string;
  field?: string;
  priceRange?: string;
}

interface TimeSlot {
  id: number;
  teacherId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  weekStartDate: string;
  isBooked?: boolean;
  isPast?: boolean;
}

interface BookedSlot {
  startTime: string;
  endTime: string;
  status: string;
}

export default function TeacherDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        setLoading(true);
        
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
        
        // Get current date and time
        const now = new Date();
        
        // Map availability and mark slots that are already booked or in the past
        const availabilityWithStatus = availabilityData.map((slot: TimeSlot) => {
          const slotStartTime = new Date(slot.startTime);
          const slotEndTime = new Date(slot.endTime);
          
          // Improve comparison between availability slots and booked slots
          // Check if any booked slot overlaps with this availability slot
          const isBooked = bookedSlotsData.some((bookedSlot: BookedSlot) => {
            const bookedStartTime = new Date(bookedSlot.startTime);
            const bookedEndTime = new Date(bookedSlot.endTime);
            
            // Compare the hours and minutes, ignoring seconds and milliseconds
            const sameStartHour = slotStartTime.getHours() === bookedStartTime.getHours();
            const sameStartMinute = slotStartTime.getMinutes() === bookedStartTime.getMinutes();
            const sameEndHour = slotEndTime.getHours() === bookedEndTime.getHours();
            const sameEndMinute = slotEndTime.getMinutes() === bookedEndTime.getMinutes();
            
            // Compare day, month, and year
            const sameStartDay = slotStartTime.getDate() === bookedStartTime.getDate();
            const sameStartMonth = slotStartTime.getMonth() === bookedStartTime.getMonth();
            const sameStartYear = slotStartTime.getFullYear() === bookedStartTime.getFullYear();
            
            // If all time components match, it's the same slot
            const timeMatches = sameStartHour && sameStartMinute && sameEndHour && sameEndMinute && 
                                sameStartDay && sameStartMonth && sameStartYear;
            
            return timeMatches;
          });
          
          // Check if this slot is in the past
          const isPast = slotStartTime < now;
          
          return {
            ...slot,
            isBooked,
            isPast
          };
        });
        
        setAvailability(availabilityWithStatus);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching teacher details:", error);
        setError("Failed to load teacher details. Please try again later.");
        setLoading(false);
      }
    };

    fetchTeacherDetails();
  }, [params.id, router]);

  const handleBookLesson = async () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot first");
      return;
    }

    setBooking(true);

    try {
      const response = await fetch("/api/private-lesson/book-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacher?.id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to book lesson");
      }

      toast.success("Ders başarıyla rezerve edildi!");
      
      // Redirect to bookings page
      router.push("/private-lesson/my-bookings");
    } catch (error) {
      console.error("Error booking lesson:", error);
      toast.error(error instanceof Error ? error.message : "Ders rezerve edilemedi. Lütfen tekrar deneyin.");
    } finally {
      setBooking(false);
    }
  };

  // Format day names
  const getDayName = (dayOfWeek: number) => {
    const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    return days[dayOfWeek];
  };

  // Format time slots
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // Function to sort days starting from current day
  const sortDaysByCurrentDay = (days: string[]) => {
    const currentDay = new Date().getDay();
    const sorted = [...days];
    
    // Sort by distance from current day
    sorted.sort((a, b) => {
      const dayA = parseInt(a);
      const dayB = parseInt(b);
      
      // Calculate distance from current day (wrapping around the week)
      const distA = (dayA - currentDay + 7) % 7;
      const distB = (dayB - currentDay + 7) % 7;
      
      return distA - distB;
    });
    
    return sorted;
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
          <Button onClick={() => router.push("/private-lesson/teachers")}>
            Öğretmenlere Dön
          </Button>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Öğretmen Bulunamadı</h1>
          <p className="text-gray-700 mb-6">İstenen öğretmen bulunamadı.</p>
          <Button onClick={() => router.push("/private-lesson/teachers")}>
            Öğretmenlere Dön
          </Button>
        </div>
      </div>
    );
  }

  // Group availability by day
  const availabilityByDay: Record<number, TimeSlot[]> = {};
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Teacher profile */}
        <Card className="md:col-span-1 bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-center mb-4">
              <div className="relative w-36 h-36 rounded-full overflow-hidden bg-gray-200 border-4 border-primary/20">
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
            {teacher.field && (
              <CardDescription className="text-center font-medium text-primary text-base mt-1">
                {teacher.field}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-2 text-gray-800">Biyografi</h3>
                <p className="text-gray-700 leading-relaxed">
                  {teacher.bio || "Bu öğretmen henüz kendisi hakkında bilgi paylaşmamış."}
                </p>
              </div>
              
              {teacher.priceRange && (
                <div className="flex items-center justify-center mt-4">
                  <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    Fiyat Aralığı: {teacher.priceRange}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Availability and booking */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white shadow-md">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-xl">Müsait Zaman Dilimleri</CardTitle>
              <CardDescription>30 dakikalık bir ders için uygun bir zaman seçin</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {Object.keys(availabilityByDay).length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Bu hafta için müsait zaman dilimi bulunamadı.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedDays.map(dayNumber => {
                    const slots = availabilityByDay[parseInt(dayNumber)];
                    const isToday = new Date().getDay() === parseInt(dayNumber);
                    
                    return (
                      <div key={dayNumber} className={`border rounded-md p-4 ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}>
                        <h3 className={`font-medium mb-3 flex items-center ${isToday ? 'text-blue-700' : ''}`}>
                          {isToday && (
                            <span className="inline-block mr-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Bugün
                            </span>
                          )}
                          {getDayName(parseInt(dayNumber))}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {slots.map(slot => {
                            // Helper function to check if slots are the same
                            const isSelectedSlot = selectedSlot && 
                              slot.startTime === selectedSlot.startTime && 
                              slot.endTime === selectedSlot.endTime;
                            
                            return (
                              <Button
                                key={`${slot.startTime}-${slot.endTime}`}
                                variant={isSelectedSlot ? "default" : "secondary"}
                                size="sm"
                                onClick={() => {
                                  if (!slot.isBooked && !slot.isPast) {
                                    setSelectedSlot(slot);
                                  } else if (slot.isBooked) {
                                    toast.error("Bu zaman dilimi zaten rezerve edilmiş");
                                  }
                                }}
                                disabled={slot.isBooked || slot.isPast}
                                className={`
                                  ${slot.isBooked ? "opacity-70 bg-red-50 text-red-700 border-red-200" : ""}
                                  ${slot.isPast ? "opacity-50 bg-gray-100 text-gray-500" : ""}
                                  ${isSelectedSlot ? "border-primary bg-primary/10 text-primary" : ""}
                                  transition-all
                                `}
                              >
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                {slot.isBooked && " (Dolu)"}
                                {slot.isPast && " (Geçmiş)"}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedSlot && (
            <Card className="bg-white shadow-md border-t-4 border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Ders Rezervasyonu</CardTitle>
                <CardDescription>
                  {teacher.name} ile {getDayName(selectedSlot.dayOfWeek)} günü saat {formatTime(selectedSlot.startTime)} için bir ders rezerve ediyorsunuz
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Notlar (İsteğe bağlı)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Görüşmek istediğiniz konuları veya özel notlarınızı buraya ekleyebilirsiniz"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 resize-none"
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleBookLesson}
                    disabled={booking}
                  >
                    {booking ? (
                      <div className="flex items-center justify-center">
                        <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                        Rezervasyon yapılıyor...
                      </div>
                    ) : "Dersi Rezerve Et"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 