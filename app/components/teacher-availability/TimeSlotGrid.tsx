import React, { useState, useEffect, useCallback } from "react";
import { format, addMinutes } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Add this interface with a different name
interface SavedTimeSlot {
  startTime: string | Date;
  endTime: string | Date;
  dayOfWeek: number;
}

// Interface for slot with row and column coordinates for grid
interface GridSlot {
  startTime: Date;
  endTime: Date;
  dayOfWeek: number;
  disabled: boolean;
  selected: boolean;
  row: number;
  col: number;
}

// Helper to generate all time slots for a week
const generateTimeSlots = () => {
  const days = [];
  // Use current date and time instead of the passed initialDate for proper "today" calculation
  const now = new Date(); // Always use current date/time
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Calculate the end date for availability (7 days from now at 23:59)
  const endOfAvailabilityPeriod = new Date(now);
  endOfAvailabilityPeriod.setDate(now.getDate() + 6); // +6 because today is already day 1
  endOfAvailabilityPeriod.setHours(23, 59, 59, 999);

  // Start from the current day (today) and add the next 6 days
  for (let i = 0; i < 7; i++) {
    // Create a new date starting from today
    const date = new Date(now);
    date.setDate(date.getDate() + i); // i=0 is today, i=1 is tomorrow, etc.
    date.setHours(0, 0, 0, 0); // Reset time part to start of day
    
    const dayNumber = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if this is today
    const isToday = i === 0; // First column is always today
    
    // Check if this date is beyond our availability period
    const isBeyondAvailabilityPeriod = date > endOfAvailabilityPeriod;
    
    const slots = [];
    // Generate slots from 00:00 to 23:30 in 30-minute increments
    let rowIndex = 0;
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = new Date(date);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = addMinutes(startTime, 30);
        
        // Check if this time slot is in the past
        // Only mark as past if the slot is from today and the time is in the past
        // or if the entire date is in the past (which shouldn't happen with our logic)
        const isPast = isToday ? 
          (hour < currentHour || (hour === currentHour && minute < currentMinute)) : 
          startTime < now;
        
        slots.push({
          startTime,
          endTime,
          dayOfWeek: dayNumber,
          disabled: isPast || isBeyondAvailabilityPeriod,
          selected: false, // Default to not selected
          row: rowIndex,
          col: i, // Column is the day index (0=today, 1=tomorrow, etc.)
        });
        
        rowIndex++;
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

interface TimeSlotGridProps {
  initialSelectedSlots?: SavedTimeSlot[];
  readOnly?: boolean;
  onSlotsChange?: (slots: SavedTimeSlot[]) => void;
}

export default function TimeSlotGrid({ 
  initialSelectedSlots = [], 
  readOnly = false,
  onSlotsChange 
}: TimeSlotGridProps) {
  const [days, setDays] = useState(generateTimeSlots());
  const [selectedSlots, setSelectedSlots] = useState<SavedTimeSlot[]>(initialSelectedSlots);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for drag selection
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{row: number, col: number} | null>(null);
  const [dragEndCell, setDragEndCell] = useState<{row: number, col: number} | null>(null);
  const [dragSelectionMode, setDragSelectionMode] = useState<'select' | 'deselect' | null>(null);
  
  // Ref to track all grid slots for easier drag operations
  const gridSlotsRef = React.useRef<GridSlot[][]>([]);
  
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
  
  // Organize grid slots for easier drag operations
  useEffect(() => {
    // Create a 2D array of all slots organized by row and column
    const grid: GridSlot[][] = [];
    
    // Initialize the grid with empty rows
    const rowCount = 48; // 24 hours * 2 (30-min slots)
    const colCount = 7; // 7 days
    
    for (let i = 0; i < rowCount; i++) {
      grid[i] = Array(colCount).fill(null);
    }
    
    // Fill the grid with slots from days
    for (const day of days) {
      for (const slot of day.slots) {
        if ('row' in slot && 'col' in slot) {
          const { row, col } = slot as GridSlot;
          if (grid[row]) {
            grid[row][col] = slot as GridSlot;
          }
        }
      }
    }
    
    gridSlotsRef.current = grid;
  }, [days]);

  // Note: toggleSlot is not used but kept for potential future use
  // const toggleSlot = (clickedDay: number, clickedSlot: { 
  //   startTime: string | Date; 
  //   endTime: string | Date; 
  //   dayOfWeek: number;
  //   disabled?: boolean;
  //   selected?: boolean;
  // }) => {
  //   if (readOnly || !isEditing) return;
  //   
  //   // Update the days state
  //   const updatedDays = [...days];
  //   const dayIndex = updatedDays.findIndex(day => day.dayNumber === clickedDay);
  //   
  //   if (dayIndex !== -1) {
  //     // First convert the slot times to strings if they are Date objects
  //     const slotStartTime = clickedSlot.startTime instanceof Date 
  //       ? clickedSlot.startTime.toISOString() 
  //       : clickedSlot.startTime;
  //       
  //     const slotEndTime = clickedSlot.endTime instanceof Date 
  //       ? clickedSlot.endTime.toISOString() 
  //       : clickedSlot.endTime;
  //
  //     const slotIndex = updatedDays[dayIndex].slots.findIndex(
  //       slot => {
  //         const slotTime = slot.startTime instanceof Date
  //           ? slot.startTime.getTime()
  //           : new Date(slot.startTime).getTime();
  //           
  //         const clickedTime = clickedSlot.startTime instanceof Date
  //           ? clickedSlot.startTime.getTime()
  //           : new Date(clickedSlot.startTime).getTime();
  //           
  //         return slotTime === clickedTime;
  //       }
  //     );
  //     
  //     if (slotIndex !== -1) {
  //       // Toggle the selected state
  //       const isCurrentlySelected = updatedDays[dayIndex].slots[slotIndex].selected;
  //       updatedDays[dayIndex].slots[slotIndex] = {
  //         ...updatedDays[dayIndex].slots[slotIndex],
  //         selected: !isCurrentlySelected
  //       };
  //       
  //       setDays(updatedDays);
  //       
  //       // Update the selectedSlots array
  //       let newSelectedSlots: SavedTimeSlot[];
  //       
  //       if (isCurrentlySelected) {
  //         // Remove from selected slots
  //         newSelectedSlots = selectedSlots.filter(
  //           slot => {
  //             const slotTime = typeof slot.startTime === 'string'
  //               ? new Date(slot.startTime).getTime()
  //               : new Date(slot.startTime).getTime();
  //               
  //             const clickedTime = typeof slotStartTime === 'string'
  //               ? new Date(slotStartTime).getTime()
  //               : new Date(slotStartTime).getTime();
  //               
  //             return slotTime !== clickedTime || slot.dayOfWeek !== clickedSlot.dayOfWeek;
  //           }
  //         );
  //       } else {
  //         // Add to selected slots
  //         newSelectedSlots = [
  //           ...selectedSlots,
  //           {
  //             startTime: slotStartTime,
  //             endTime: slotEndTime,
  //             dayOfWeek: clickedSlot.dayOfWeek
  //           }
  //         ];
  //       }
  //       
  //       setSelectedSlots(newSelectedSlots);
  //       
  //       // Call the onSlotsChange callback if provided
  //       if (onSlotsChange) {
  //         onSlotsChange(newSelectedSlots);
  //       }
  //     }
  //   }
  // };
  
  // Handle drag selection operations
  const updateDragSelection = useCallback(() => {
    if (!isDragging || !dragStartCell || !dragEndCell || !isEditing || readOnly) return;
    
    // Determine the boundaries of the selection
    const startRow = Math.min(dragStartCell.row, dragEndCell.row);
    const endRow = Math.max(dragStartCell.row, dragEndCell.row);
    const startCol = Math.min(dragStartCell.col, dragEndCell.col);
    const endCol = Math.max(dragStartCell.col, dragEndCell.col);
    
    // Clone the current days
    const updatedDays = [...days];
    const newSelectedSlots: SavedTimeSlot[] = [...selectedSlots];
    
    // Track which slots were added or removed
    const addedSlots: SavedTimeSlot[] = [];
    const removedSlots: SavedTimeSlot[] = [];
    
    // Iterate through all days
    for (const day of updatedDays) {
      // Iterate through all slots in this day
      for (const slot of day.slots) {
        if (!('row' in slot) || !('col' in slot)) continue;
        
        const { row, col } = slot as unknown as { row: number, col: number };
        const isInSelectionRange = 
          row >= startRow && row <= endRow && 
          col >= startCol && col <= endCol;
        
        // Skip disabled slots
        if (slot.disabled) continue;
        
        if (isInSelectionRange) {
          // Convert the slot times to strings
          const slotStartTime = slot.startTime instanceof Date 
            ? slot.startTime.toISOString() 
            : slot.startTime;
            
          const slotEndTime = slot.endTime instanceof Date 
            ? slot.endTime.toISOString() 
            : slot.endTime;
          
          // Create a SavedTimeSlot object
          const savedSlot: SavedTimeSlot = {
            startTime: slotStartTime,
            endTime: slotEndTime,
            dayOfWeek: slot.dayOfWeek
          };
          
          // Apply the selection mode
          if (dragSelectionMode === 'select' && !slot.selected) {
            // Add to selection
            slot.selected = true;
            addedSlots.push(savedSlot);
          } else if (dragSelectionMode === 'deselect' && slot.selected) {
            // Remove from selection
            slot.selected = false;
            removedSlots.push(savedSlot);
          }
        }
      }
    }
    
    // Update the selected slots list
    let updatedSelectedSlots = newSelectedSlots;
    
    // Add newly selected slots
    if (addedSlots.length > 0) {
      updatedSelectedSlots = [...updatedSelectedSlots, ...addedSlots];
    }
    
    // Remove deselected slots
    if (removedSlots.length > 0) {
      updatedSelectedSlots = updatedSelectedSlots.filter(slot => {
        // Check if this slot is in the removedSlots list
        return !removedSlots.some(removedSlot => {
          const slotStartTime = typeof slot.startTime === 'string'
            ? new Date(slot.startTime)
            : new Date(slot.startTime);
          
          const removedStartTime = typeof removedSlot.startTime === 'string'
            ? new Date(removedSlot.startTime)
            : new Date(removedSlot.startTime);
          
          return (
            slotStartTime.getHours() === removedStartTime.getHours() &&
            slotStartTime.getMinutes() === removedStartTime.getMinutes() &&
            slot.dayOfWeek === removedSlot.dayOfWeek
          );
        });
      });
    }
    
    // Update state
    setDays(updatedDays);
    setSelectedSlots(updatedSelectedSlots);
    
    // Call the onSlotsChange callback if provided
    if (onSlotsChange) {
      onSlotsChange(updatedSelectedSlots);
    }
  }, [isDragging, dragStartCell, dragEndCell, isEditing, readOnly, days, selectedSlots, dragSelectionMode, onSlotsChange]);
  
  // Apply drag selection when dragEndCell changes
  useEffect(() => {
    updateDragSelection();
  }, [dragEndCell, updateDragSelection]);
  
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
        if (response.status === 400 && (data.message.includes("profil bilgilerinizi tamamlayın") || data.missingFields)) {
          // Enhanced error handling for incomplete profile
          toast.error("Profil bilgilerinizi tamamlamanız gerekiyor", {
            duration: 8000, // Show for 8 seconds
            description: data.message,
            action: {
              label: "Profil Sayfasına Git",
              onClick: () => window.location.href = "/private-lesson/teacher-dashboard"
            }
          });
        } else {
          toast.error(`Hata: ${data.message || 'Bilinmeyen bir hata oluştu.'}`);
        }
      }
    } catch (error) {
      toast.error('Bir hata oluştu.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle mouse events for drag selection
  const handleMouseDown = (slot: GridSlot, dayNumber: number, row: number, col: number) => {
    if (readOnly || !isEditing || slot.disabled) return;
    
    setIsDragging(true);
    setDragStartCell({ row, col });
    setDragEndCell({ row, col });
    // Set the drag mode based on the current selection state of the cell
    setDragSelectionMode(slot.selected ? 'deselect' : 'select');
    
    // Prevent default text selection during drag
    document.body.classList.add('select-none');
  };
  
  const handleMouseMove = (row: number, col: number) => {
    if (!isDragging || readOnly || !isEditing) return;
    setDragEndCell({ row, col });
  };
  
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
      setDragSelectionMode(null);
      
      // Re-enable text selection
      document.body.classList.remove('select-none');
    }
  }, [isDragging]);
  
  // Add global mouse up handler to handle cases where mouse is released outside the grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMouseUp]);
  
  // Helper to check if a cell is in the current drag selection
  const isInDragSelection = (row: number, col: number) => {
    if (!isDragging || !dragStartCell || !dragEndCell) return false;
    
    const startRow = Math.min(dragStartCell.row, dragEndCell.row);
    const endRow = Math.max(dragStartCell.row, dragEndCell.row);
    const startCol = Math.min(dragStartCell.col, dragEndCell.col);
    const endCol = Math.max(dragStartCell.col, dragEndCell.col);
    
    return row >= startRow && row <= endRow && col >= startCol && col <= endCol;
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-4 border">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Müsait Olduğunuz Zamanlar</h2>
        <div>
          {!readOnly && (
            isEditing ? (
              <div className="space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="primary"
                  className="flex items-center"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                      Kaydediliyor...
                    </>
                  ) : 'Kaydet'}
                </Button>
                <Button
                  onClick={() => {
                    // Reset to initial state
                    updateDaysWithSelectedSlots(initialSelectedSlots);
                    setSelectedSlots(initialSelectedSlots);
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                  variant="ghost"
                  className="transition-colors"
                >
                  İptal
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={async () => {
                  // Check profile completion before allowing edit
                  try {
                    const response = await fetch('/api/teacher-availability/check-profile');
                    if (!response.ok) {
                      const data = await response.json();
                      if (response.status === 400 && (data.message.includes("profil bilgilerinizi tamamlayın") || data.missingFields)) {
                        toast.error("Profil bilgilerinizi tamamlamanız gerekiyor", {
                          duration: 8000,
                          description: data.message,
                          action: {
                            label: "Profil Sayfasına Git",
                            onClick: () => window.location.href = "/private-lesson/teacher-dashboard"
                          }
                        });
                        return;
                      }
                    }
                    setIsEditing(true);
                  } catch (error) {
                    console.error('Error checking profile:', error);
                    setIsEditing(true); // Allow editing on error
                  }
                }}
              >
                Düzenle
              </Button>
            )
          )}
        </div>
      </div>
      
      {isEditing && !readOnly && (
        <div className="mb-3 p-2 bg-blue-50 rounded-md text-xs">
          <p className="font-medium text-blue-800">
            <span className="mr-2">💡</span>
            İpucu: Fare ile sürükleyerek birden fazla zaman dilimini aynı anda seçebilirsiniz. 
            Tek tıklama ile de zaman dilimlerini seçebilirsiniz.
          </p>
        </div>
      )}
      
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
          // Set end date to 7 days from now instead of next Friday
          endOfAvailabilityPeriod.setDate(now.getDate() + 6); // +6 because today is already day 1
          endOfAvailabilityPeriod.setHours(23, 59, 59, 999);
          
          const isBeyondAvailabilityPeriod = day.date > endOfAvailabilityPeriod;
            
          return (
            <div 
              key={day.dayNumber} 
              className={`text-center p-1.5 
                ${isToday ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-500' : 'bg-gray-100'} 
                ${isBeyondAvailabilityPeriod ? 'opacity-50' : ''}
                sticky top-0 z-10`}
            >
              <div className="font-bold flex items-center justify-center text-sm">
                {isToday && (
                  <span className="inline-block mr-1 px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Bugün
                  </span>
                )}
                {format(day.date, 'EEEE', { locale: tr })}
              </div>
              <div className="text-xs">
                {format(day.date, 'd MMMM', { locale: tr })}
              </div>
            </div>
          );
        })}
        
        {/* Time grid */}
        {/* First, create an array of all unique times */}
        {Array.from(new Set(days[0].slots.map(slot => 
          format(slot.startTime, 'HH:mm')
        ))).map((timeStr, rowIndex) => (
          <React.Fragment key={timeStr}>
            {/* For each time, show a cell for each day */}
            {days.map((day, colIndex) => {
              const slot = day.slots.find(s => 
                format(s.startTime, 'HH:mm') === timeStr
              );
              
              if (!slot) return null;
              
              // Check if this time is an hour mark (00 minutes)
              const isHourMark = timeStr.endsWith(':00');
              
              // Check if this cell is in the current drag selection
              const isInSelection = isInDragSelection(rowIndex, colIndex);
              
              // Determine styling based on selection state, drag state, etc.
              const isBeingSelected = isInSelection && dragSelectionMode === 'select';
              const isBeingDeselected = isInSelection && dragSelectionMode === 'deselect';
              
              return (
                <div 
                  key={`${day.dayNumber}-${timeStr}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent text selection
                    handleMouseDown(slot, day.dayNumber, rowIndex, colIndex);
                  }}
                  onMouseMove={() => handleMouseMove(rowIndex, colIndex)}
                  className={`
                    text-center p-1 border text-xs
                    ${slot.selected ? 'bg-green-500 text-white font-medium' : 'bg-white'}
                    ${isBeingSelected && !slot.selected ? 'bg-green-300 text-white' : ''}
                    ${isBeingDeselected && slot.selected ? 'bg-green-200' : ''}
                    ${slot.disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}
                    ${!isEditing && !readOnly ? 'cursor-default' : ''}
                    ${isHourMark ? 'border-t-2 border-t-gray-300' : ''}
                    transition-colors duration-150
                    ${isDragging ? 'select-none' : ''}
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