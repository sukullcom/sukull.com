import React, { useEffect, useState, useCallback } from 'react';
import { format, addMinutes, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

// Add this interface with a different name
interface SavedTimeSlot {
  startTime: string | Date;
  endTime: string | Date;
  dayOfWeek: number;
}

// Helper to generate all time slots for a week
const generateTimeSlots = (weekStartDate: Date) => {
  const days = [];
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Calculate the end date for availability (next Friday at 23:59)
  const endOfAvailabilityPeriod = new Date();
  // Find the days until next Friday (5 = Friday)
  // If today is Friday, we want next Friday
  const daysUntilNextFriday = (5 - now.getDay() + 7) % 7 || 7;
  endOfAvailabilityPeriod.setDate(now.getDate() + daysUntilNextFriday);
  endOfAvailabilityPeriod.setHours(23, 59, 59, 999);

  // Start from the current day and wrap around to complete 7 days
  for (let i = 0; i < 7; i++) {
    // Calculate the day offset based on current day
    // We start from today (i=0) and add days sequentially
    // This ensure the leftmost column is always today
    const dayOffset = i;
    
    // Create a new date starting from today
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0); // Reset time part to start of day
    
    const dayNumber = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if this is today
    const isToday = i === 0; // First column is always today
    
    // Check if this date is beyond our availability period
    const isBeyondAvailabilityPeriod = date > endOfAvailabilityPeriod;
    
    const slots = [];
    // Generate slots from 00:00 to 23:30 in 30-minute increments
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = new Date(date);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = addMinutes(startTime, 30);
        
        // Check if this time slot is in the past or beyond availability period
        // Only mark as past if the slot is from today and the time is in the past
        // or if the date is beyond our availability period
        const isPast = isToday ? 
          (hour < currentHour || (hour === currentHour && minute < currentMinute)) : 
          isAfter(now, startTime) || isBeyondAvailabilityPeriod;
        
        slots.push({
          startTime,
          endTime,
          dayOfWeek: dayNumber,
          disabled: isPast,
          selected: false, // Default to not selected
        });
      }
    }
    
    days.push({
      date,
      dayNumber,
      slots,
    });
  }
  
  return days;
};

type TimeSlotGridProps = {
  weekStartDate: Date;
  initialSelectedSlots?: SavedTimeSlot[];
  readOnly?: boolean;
  onSlotsChange?: (slots: SavedTimeSlot[]) => void;
};

export default function TimeSlotGrid({ 
  weekStartDate, 
  initialSelectedSlots = [], 
  readOnly = false,
  onSlotsChange 
}: TimeSlotGridProps) {
  const [days, setDays] = useState(generateTimeSlots(weekStartDate));
  const [selectedSlots, setSelectedSlots] = useState<SavedTimeSlot[]>(initialSelectedSlots);
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [isSaving, setIsSaving] = useState(false);
  
  // Function to update the days with selected slots - memoized with useCallback
  const updateDaysWithSelectedSlots = useCallback((slots: SavedTimeSlot[]) => {
    setDays(currentDays => 
      currentDays.map(day => ({
        ...day,
        slots: day.slots.map(slot => {
          // Check if this slot is in the list of selected slots by comparing startTime and dayOfWeek
          const isSelected = slots.some(
            selectedSlot => {
              // Convert string times to Date objects for comparison
              const selectedStartTime = new Date(selectedSlot.startTime);
              const slotStartTime = new Date(slot.startTime);
              
              return (
                // Compare the time portions only to avoid issues with date objects
                selectedStartTime.getHours() === slotStartTime.getHours() &&
                selectedStartTime.getMinutes() === slotStartTime.getMinutes() &&
                selectedSlot.dayOfWeek === slot.dayOfWeek
              );
            }
          );
          return {
            ...slot,
            selected: isSelected
          };
        })
      }))
    );
  }, []);
  
  // When initialSelectedSlots changes, update the grid
  useEffect(() => {
    // Create a new days array with the selected slots marked
    updateDaysWithSelectedSlots(initialSelectedSlots);
    
    // Update the selectedSlots state
    setSelectedSlots(initialSelectedSlots);
  }, [initialSelectedSlots, updateDaysWithSelectedSlots]);

  const toggleSlot = (clickedDay: number, clickedSlot: { 
    startTime: string | Date; 
    endTime: string | Date; 
    dayOfWeek: number;
    disabled?: boolean;
    selected?: boolean;
  }) => {
    if (readOnly || !isEditing) return;
    
    // Update the days state
    const updatedDays = [...days];
    const dayIndex = updatedDays.findIndex(day => day.dayNumber === clickedDay);
    
    if (dayIndex !== -1) {
      // First convert the slot times to strings if they are Date objects
      const slotStartTime = clickedSlot.startTime instanceof Date 
        ? clickedSlot.startTime.toISOString() 
        : clickedSlot.startTime;
        
      const slotEndTime = clickedSlot.endTime instanceof Date 
        ? clickedSlot.endTime.toISOString() 
        : clickedSlot.endTime;

      const slotIndex = updatedDays[dayIndex].slots.findIndex(
        slot => {
          const slotTime = slot.startTime instanceof Date
            ? slot.startTime.getTime()
            : new Date(slot.startTime).getTime();
            
          const clickedTime = clickedSlot.startTime instanceof Date
            ? clickedSlot.startTime.getTime()
            : new Date(clickedSlot.startTime).getTime();
            
          return slotTime === clickedTime;
        }
      );
      
      if (slotIndex !== -1) {
        // Toggle the selected state
        const isCurrentlySelected = updatedDays[dayIndex].slots[slotIndex].selected;
        updatedDays[dayIndex].slots[slotIndex] = {
          ...updatedDays[dayIndex].slots[slotIndex],
          selected: !isCurrentlySelected
        };
        
        setDays(updatedDays);
        
        // Update the selectedSlots array
        let newSelectedSlots: SavedTimeSlot[];
        
        if (isCurrentlySelected) {
          // Remove from selected slots
          newSelectedSlots = selectedSlots.filter(
            slot => {
              const slotTime = typeof slot.startTime === 'string'
                ? new Date(slot.startTime).getTime()
                : new Date(slot.startTime).getTime();
                
              const clickedTime = typeof slotStartTime === 'string'
                ? new Date(slotStartTime).getTime()
                : new Date(slotStartTime).getTime();
                
              return slotTime !== clickedTime || slot.dayOfWeek !== clickedSlot.dayOfWeek;
            }
          );
        } else {
          // Add to selected slots
          newSelectedSlots = [
            ...selectedSlots,
            {
              startTime: slotStartTime,
              endTime: slotEndTime,
              dayOfWeek: clickedSlot.dayOfWeek
            }
          ];
        }
        
        setSelectedSlots(newSelectedSlots);
        
        // Call the onSlotsChange callback if provided
        if (onSlotsChange) {
          onSlotsChange(newSelectedSlots);
        }
      }
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/teacher-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slots: selectedSlots }),
      });
      
      if (response.ok) {
        // Get the saved slots from the response
        const data = await response.json();
        const savedSlots = data.availability || [];
        
        // Format the saved slots
        const formattedSavedSlots = savedSlots.map((slot: SavedTimeSlot) => {
          // Convert to string if needed
          const startTime = typeof slot.startTime === 'string' 
            ? slot.startTime 
            : slot.startTime.toISOString();
          
          const endTime = typeof slot.endTime === 'string'
            ? slot.endTime
            : slot.endTime.toISOString();
            
          return {
            startTime,
            endTime,
            dayOfWeek: slot.dayOfWeek
          };
        });
        
        // Update the UI with the saved slots
        updateDaysWithSelectedSlots(formattedSavedSlots);
        setSelectedSlots(formattedSavedSlots);
        
        // Display appropriate success message based on whether slots were filtered
        if (data.filtered) {
          toast.success(`Müsait olduğunuz zamanlar kaydedildi. ${data.filteredCount} geçmiş zaman dilimi otomatik olarak kaldırıldı.`);
        } else {
          toast.success('Müsait olduğunuz zamanlar kaydedildi.');
        }
        
        setIsEditing(false);
      } else {
        const data = await response.json();
        toast.error(`Hata: ${data.message || 'Bilinmeyen bir hata oluştu.'}`);
      }
    } catch (error) {
      toast.error('Bir hata oluştu.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6 border">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Müsait Olduğunuz Zamanlar</h2>
        <div>
          {!readOnly && (
            isEditing ? (
              <div className="space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`${isSaving ? 'bg-gray-400' : 'bg-primary'} text-white px-4 py-2 rounded-md flex items-center transition-colors`}
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                      Kaydediliyor...
                    </>
                  ) : 'Kaydet'}
                </button>
                <button
                  onClick={() => {
                    // Reset to initial state
                    updateDaysWithSelectedSlots(initialSelectedSlots);
                    setSelectedSlots(initialSelectedSlots);
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors"
              >
                Düzenle
              </button>
            )
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 overflow-x-auto pb-2">
        {/* Day headers */}
        {days.map(day => {
          const isToday = 
            day.date.getDate() === new Date().getDate() && 
            day.date.getMonth() === new Date().getMonth() && 
            day.date.getFullYear() === new Date().getFullYear();
            
          // Calculate if this day is beyond our availability period
          const now = new Date();
          const endOfAvailabilityPeriod = new Date();
          const daysUntilNextFriday = (5 - now.getDay() + 7) % 7 || 7;
          endOfAvailabilityPeriod.setDate(now.getDate() + daysUntilNextFriday);
          endOfAvailabilityPeriod.setHours(23, 59, 59, 999);
          
          const isBeyondAvailabilityPeriod = day.date > endOfAvailabilityPeriod;
            
          return (
            <div 
              key={day.dayNumber} 
              className={`text-center p-2 
                ${isToday ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-500' : 'bg-gray-100'} 
                ${isBeyondAvailabilityPeriod ? 'opacity-50' : ''}
                sticky top-0`}
            >
              <div className="font-bold flex items-center justify-center">
                {isToday && (
                  <span className="inline-block mr-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Bugün
                  </span>
                )}
                {format(day.date, 'EEEE', { locale: tr })}
              </div>
              <div className="text-sm">
                {format(day.date, 'd MMMM', { locale: tr })}
              </div>
            </div>
          );
        })}
        
        {/* Time grid */}
        {/* First, create an array of all unique times */}
        {Array.from(new Set(days[0].slots.map(slot => 
          format(slot.startTime, 'HH:mm')
        ))).map(timeStr => (
          <React.Fragment key={timeStr}>
            {/* For each time, show a cell for each day */}
            {days.map(day => {
              const slot = day.slots.find(s => 
                format(s.startTime, 'HH:mm') === timeStr
              );
              
              if (!slot) return null;
              
              // Check if this time is an hour mark (00 minutes)
              const isHourMark = timeStr.endsWith(':00');
              
              return (
                <div 
                  key={`${day.dayNumber}-${timeStr}`}
                  onClick={() => {
                    if ((isEditing || readOnly) && !slot.disabled) {
                      toggleSlot(day.dayNumber, {
                        ...slot,
                        startTime: slot.startTime.toISOString(),
                        endTime: slot.endTime.toISOString()
                      });
                    }
                  }}
                  className={`
                    text-center p-2 border text-sm
                    ${slot.selected ? 'bg-green-500 text-white font-medium' : 'bg-white'}
                    ${slot.disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}
                    ${!isEditing && !readOnly ? 'cursor-default' : ''}
                    ${isHourMark ? 'border-t-2 border-t-gray-300' : ''}
                    transition-all duration-200
                  `}
                >
                  {timeStr}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Not: Zamanlar 30 dakikalık aralıklarla gösterilmektedir. Yeşil ile işaretlenen zamanlar müsait olduğunuz zamanlardır.</p>
        <p className="mt-2 text-primary font-medium">Sadece bugünden başlayarak gelecek Cuma gününe kadar olan saatleri seçebilirsiniz.</p>
      </div>
    </div>
  );
} 