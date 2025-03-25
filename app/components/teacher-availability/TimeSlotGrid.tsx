import React, { useEffect, useState } from 'react';
import { format, addMinutes, isAfter, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

// Helper to generate all time slots for a week
const generateTimeSlots = (weekStartDate: Date) => {
  const days = [];
  const now = new Date();
  const today = startOfDay(now);

  // For each day of the week (Monday to Sunday)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + dayOffset);
    const dayNumber = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const slots = [];
    // Generate slots from 00:00 to 23:30 in 30-minute increments
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = new Date(date);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = addMinutes(startTime, 30);
        
        // Check if this time slot is in the past
        const isPast = isAfter(now, startTime);
        
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

type TimeSlot = {
  startTime: Date;
  endTime: Date;
  dayOfWeek: number;
  disabled?: boolean;
  selected?: boolean;
};

type TimeSlotGridProps = {
  weekStartDate: Date;
  initialSelectedSlots?: TimeSlot[];
  readOnly?: boolean;
  onSlotsChange?: (slots: TimeSlot[]) => void;
};

export default function TimeSlotGrid({ 
  weekStartDate, 
  initialSelectedSlots = [], 
  readOnly = false,
  onSlotsChange 
}: TimeSlotGridProps) {
  const [days, setDays] = useState(generateTimeSlots(weekStartDate));
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(initialSelectedSlots);
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [isSaving, setIsSaving] = useState(false);
  
  // When initialSelectedSlots changes, update the grid
  useEffect(() => {
    // Create a new days array with the selected slots marked
    updateDaysWithSelectedSlots(initialSelectedSlots);
    
    // Update the selectedSlots state
    setSelectedSlots(initialSelectedSlots);
  }, [initialSelectedSlots]);

  // Function to update the days with selected slots
  const updateDaysWithSelectedSlots = (slots: TimeSlot[]) => {
    const updatedDays = days.map(day => ({
      ...day,
      slots: day.slots.map(slot => {
        // Check if this slot is in the list of selected slots by comparing startTime and dayOfWeek
        const isSelected = slots.some(
          selectedSlot => 
            // Compare the time portions only to avoid issues with date objects
            selectedSlot.startTime.getHours() === slot.startTime.getHours() &&
            selectedSlot.startTime.getMinutes() === slot.startTime.getMinutes() &&
            selectedSlot.dayOfWeek === slot.dayOfWeek
        );
        
        return {
          ...slot,
          selected: isSelected
        };
      })
    }));
    
    setDays(updatedDays);
  };
  
  const toggleSlot = (clickedDay: number, clickedSlot: TimeSlot) => {
    if (readOnly || !isEditing || clickedSlot.disabled) return;
    
    // Update the days state
    const updatedDays = [...days];
    const dayIndex = updatedDays.findIndex(day => day.dayNumber === clickedDay);
    
    if (dayIndex !== -1) {
      const slotIndex = updatedDays[dayIndex].slots.findIndex(
        slot => slot.startTime.getTime() === clickedSlot.startTime.getTime()
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
        let newSelectedSlots: TimeSlot[];
        
        if (isCurrentlySelected) {
          // Remove from selected slots
          newSelectedSlots = selectedSlots.filter(
            slot => 
              slot.startTime.getTime() !== clickedSlot.startTime.getTime() ||
              slot.dayOfWeek !== clickedSlot.dayOfWeek
          );
        } else {
          // Add to selected slots
          newSelectedSlots = [
            ...selectedSlots,
            {
              startTime: clickedSlot.startTime,
              endTime: clickedSlot.endTime,
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
        const formattedSavedSlots = savedSlots.map((slot: any) => ({
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
          dayOfWeek: slot.dayOfWeek
        }));
        
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
    <div className="bg-white shadow rounded p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Müsait Olduğunuz Zamanlar</h2>
        <div>
          {!readOnly && (
            isEditing ? (
              <div className="space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`${isSaving ? 'bg-gray-400' : 'bg-primary'} text-white px-4 py-2 rounded flex items-center`}
                >
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  onClick={() => {
                    // Reset to initial state
                    updateDaysWithSelectedSlots(initialSelectedSlots);
                    setSelectedSlots(initialSelectedSlots);
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                  className="bg-gray-200 px-4 py-2 rounded"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-primary text-white px-4 py-2 rounded"
              >
                Düzenle
              </button>
            )
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {days.map(day => (
          <div 
            key={day.dayNumber} 
            className="text-center font-bold p-2 bg-gray-100"
          >
            {format(day.date, 'EEEE', { locale: tr })}
            <div className="text-sm font-normal">
              {format(day.date, 'd MMMM', { locale: tr })}
            </div>
          </div>
        ))}
        
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
              
              return (
                <div 
                  key={`${day.dayNumber}-${timeStr}`}
                  onClick={() => toggleSlot(day.dayNumber, slot)}
                  className={`
                    text-center p-2 border text-sm
                    ${slot.selected ? 'bg-green-500 text-white' : 'bg-white'}
                    ${slot.disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}
                    ${!isEditing && !readOnly ? 'cursor-default' : ''}
                  `}
                >
                  {timeStr}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
} 