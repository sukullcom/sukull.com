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
        console.log('Fetching teacher details for ID:', params.id);
        setLoading(true);
        
        const response = await fetch(`/api/private-lesson/teacher-details/${params.id}`);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          
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
        console.log('Teacher data received:', data);
        
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
        console.log('Booked slots received:', bookedSlotsData);
        
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
            
            // Simple string-based comparison of the dates for debugging
            const slotTimeString = `${slotStartTime.toISOString()} - ${slotEndTime.toISOString()}`;
            const bookedTimeString = `${bookedStartTime.toISOString()} - ${bookedEndTime.toISOString()}`;
            
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
            
            if (timeMatches) {
              console.log(`Found booked slot: ${slotTimeString} matches ${bookedTimeString}`);
            }
            
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
        
        // Log all booked slots for debugging
        const bookedSlots = availabilityWithStatus.filter((slot: TimeSlot) => slot.isBooked);
        console.log(`Identified ${bookedSlots.length} booked slots out of ${availabilityWithStatus.length} total slots`);
        if (bookedSlots.length > 0) {
          console.log('Sample booked slot:', bookedSlots[0]);
        }
        
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

      toast.success("Lesson booked successfully!");
      
      // Redirect to bookings page
      router.push("/private-lesson/my-bookings");
    } catch (error) {
      console.error("Error booking lesson:", error);
      toast.error(error instanceof Error ? error.message : "Failed to book lesson. Please try again.");
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
            Back to Teachers
          </Button>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Teacher Not Found</h1>
          <p className="text-gray-700 mb-6">The requested teacher could not be found.</p>
          <Button onClick={() => router.push("/private-lesson/teachers")}>
            Back to Teachers
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

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{teacher.name}</h1>
        <Button variant="primaryOutline" onClick={() => router.push("/private-lesson/teachers")}>
          Back to Teachers
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Teacher profile */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                <Image
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(teacher.name)}`}
                  alt={teacher.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>
            <CardTitle className="text-center">{teacher.name}</CardTitle>
            <CardDescription className="text-center">{teacher.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">About</h3>
                <p className="text-gray-700 mt-1">{teacher.bio || "No bio available"}</p>
              </div>
              {teacher.meetLink && (
                <div>
                  <h3 className="font-medium">Meet Link</h3>
                  <p className="text-blue-600 hover:underline mt-1">
                    <a href={teacher.meetLink} target="_blank" rel="noopener noreferrer">
                      {teacher.meetLink}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Availability and booking */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Time Slots</CardTitle>
              <CardDescription>Choose a time slot to book a 30-minute lesson</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(availabilityByDay).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No availability found for this week.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(availabilityByDay).map(([dayNumber, slots]) => (
                    <div key={dayNumber} className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">{getDayName(parseInt(dayNumber))}</h3>
                      <div className="flex flex-wrap gap-2">
                        {slots.map(slot => {
                          // Helper function to check if slots are the same
                          const isSelectedSlot = selectedSlot && 
                            slot.startTime === selectedSlot.startTime && 
                            slot.endTime === selectedSlot.endTime;
                          
                          // Determine button variant based on slot status
                          let buttonVariant: "default" | "secondaryOutline" | "primary" | "primaryOutline" = "secondaryOutline";
                          if (isSelectedSlot) buttonVariant = "default";
                          if (slot.isBooked) buttonVariant = "primary";
                          
                          return (
                            <Button
                              key={`${slot.startTime}-${slot.endTime}`}
                              variant={buttonVariant}
                              size="sm"
                              onClick={() => {
                                if (!slot.isBooked && !slot.isPast) {
                                  setSelectedSlot(slot);
                                } else if (slot.isBooked) {
                                  toast.error("This time slot is already booked");
                                }
                              }}
                              disabled={slot.isBooked || slot.isPast}
                              className={`
                                ${slot.isBooked ? "opacity-80 cursor-not-allowed bg-red-100 text-red-800 border-red-300" : ""}
                                ${slot.isPast ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500" : ""}
                                ${isSelectedSlot ? "border-primary bg-primary/10" : ""}
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedSlot && (
            <Card>
              <CardHeader>
                <CardTitle>Book Your Lesson</CardTitle>
                <CardDescription>
                  You&apos;re booking a lesson with {teacher.name} on {getDayName(selectedSlot.dayOfWeek)} at {formatTime(selectedSlot.startTime)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes or specific topics you'd like to cover"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleBookLesson}
                    disabled={booking}
                  >
                    {booking ? "Booking..." : "Book Lesson"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Debug information - remove in production */}
      <div className="mt-10 p-4 border border-gray-200 rounded-md bg-gray-50">
        <h3 className="font-bold mb-2">Debug Information</h3>
        <p>Teacher ID: {params.id}</p>
        <p>Availability Slots: {availability.length}</p>
      </div>
    </div>
  );
} 