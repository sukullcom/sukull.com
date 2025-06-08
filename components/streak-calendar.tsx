// components/StreakCalendarAdvanced.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserDailyStreakForMonth } from "@/actions/daily-streak";
import { addMonths, endOfMonth, getDay, startOfMonth, format } from "date-fns";
import { Button } from "./ui/button";
import Image from "next/image";

interface DailyRecord {
  id: number;
  date: string; // "YYYY-MM-DD"
  achieved: boolean;
}

interface StreakCalendarAdvancedProps {
  startDate: string; // The date (ISO string) when streak tracking began (e.g., user registration date)
}

export default function StreakCalendarAdvanced({ startDate }: StreakCalendarAdvancedProps) {
  const now = new Date();
  // Use current month as default
  const [selectedDate, setSelectedDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch daily records whenever selected month changes
  const fetchRecords = async (date: Date) => {
    setLoading(true);
    try {
      const month = date.getMonth();  // Month should be 0-11 (JS Date standard)
      const year = date.getFullYear();
      const recs = await getUserDailyStreakForMonth(month, year);
      
      // Properly format records with consistent date strings
      const formattedRecs = recs.map(rec => {
        // Ensure we get consistent YYYY-MM-DD format
        const dateObj = new Date(rec.date + 'T00:00:00.000Z'); // Force UTC to avoid timezone issues
        const dateStr = dateObj.toISOString().split('T')[0];
        
        console.log(`Processing record: ID ${rec.id}, Original date: ${rec.date}, Formatted: ${dateStr}, Achieved: ${rec.achieved}`);
        
        return {
          ...rec,
          date: dateStr
        };
      });
      
      setRecords(formattedRecs);
    } catch (err) {
      console.error("Failed to fetch daily streak records:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(selectedDate);
  }, [selectedDate]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setSelectedDate(prev => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    const next = addMonths(selectedDate, 1);
    // Disable navigating to a month after the current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (next > currentMonthStart) return;
    setSelectedDate(next);
  };

  // Determine boundaries: user should not go to a month earlier than their start month.
  const userStart = new Date(startDate);
  const startBoundary = new Date(userStart.getFullYear(), userStart.getMonth(), 1);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const isPrevDisabled = selectedDate <= startBoundary;
  const isNextDisabled = selectedDate >= currentMonthStart;

  // Build calendar grid cells
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const startWeekday = getDay(monthStart); // 0 = Sunday, 6 = Saturday
  const daysInMonth = monthEnd.getDate();

  // Create an array for calendar cells (empty cells before the first day, then days, then padding)
  const cells: { day?: number; date?: string }[] = [];
  // Fill empty cells for days before monthStart
  for (let i = 0; i < startWeekday; i++) {
    cells.push({});
  }
  // Fill in days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d);
    const dateStr = dateObj.toISOString().split("T")[0];
    cells.push({ day: d, date: dateStr });
  }
  // Pad remaining cells so that the grid is complete
  while (cells.length % 7 !== 0) {
    cells.push({});
  }

  // Weekday headers
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get today's date for comparison
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Render a single cell for each day
  const renderCell = (cell: { day?: number; date?: string }, index: number) => {
    if (!cell.day || !cell.date) {
      return <div key={index} className="w-10 h-10"></div>;
    }
    
    // Find the record for this specific date
    const record = records.find(r => r.date === cell.date);
    
    // Determine if daily goal was achieved
    let achieved = false;
    let showIcon = true;
    
    if (record) {
      // We have a record for this day
      achieved = record.achieved;
      console.log(`Day ${cell.day} (${cell.date}): Record found - achieved: ${achieved}`);
    } else {
      // No record found
      const isCurrentMonth = selectedDate.getFullYear() === now.getFullYear() && 
                            selectedDate.getMonth() === now.getMonth();
      const isFutureDay = cell.date! > todayStr;
      const isPastDay = cell.date! < todayStr;
      
      if (isCurrentMonth && isFutureDay) {
        // Future day in current month - don't show any icon or show gray
        showIcon = false;
        console.log(`Day ${cell.day} (${cell.date}): Future day in current month - no icon`);
      } else if (isPastDay) {
        // Past day with no record - means goal was not achieved
        achieved = false;
        console.log(`Day ${cell.day} (${cell.date}): Past day with no record - not achieved`);
      } else if (cell.date === todayStr) {
        // Today with no record - check real-time progress would be handled by parent
        // For now, show as not achieved until record is created
        achieved = false;
        console.log(`Day ${cell.day} (${cell.date}): Today with no record - not achieved yet`);
      }
    }
    
    return (
      <div key={index} className="w-10 h-12 flex flex-col items-center justify-center border border-gray-200 rounded-lg p-1 m-1">
        <span className="text-xs font-medium">{cell.day}</span>
        {showIcon && (
          <Image
            width={16}
            height={16}
            src={achieved ? "/istikrar.svg" : "/istikrarsiz.svg"}
            alt={achieved ? "Daily goal achieved" : "Daily goal not achieved"}
            className="w-4 h-4 mt-1"
            onError={(e) => {
              console.error(`Failed to load icon for day ${cell.day}: ${achieved ? 'istikrar.svg' : 'istikrarsiz.svg'}`);
              // Fallback to text if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        {!showIcon && (
          <div className="w-4 h-4 mt-1 flex items-center justify-center">
            <span className="text-xs text-gray-400">•</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          onClick={handlePrevMonth} 
          disabled={isPrevDisabled}
          className="h-8 w-8 p-0"
        >
          ←
        </Button>
        <div className="text-lg font-bold text-gray-800">
          {format(selectedDate, "MMMM yyyy")}
        </div>
        <Button 
          variant="outline" 
          onClick={handleNextMonth} 
          disabled={isNextDisabled}
          className="h-8 w-8 p-0"
        >
          →
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <Image src="/istikrar.svg" alt="Goal achieved" width={12} height={12} />
          <span>Hedef Tamamlandı</span>
        </div>
        <div className="flex items-center gap-1">
          <Image src="/istikrarsiz.svg" alt="Goal not achieved" width={12} height={12} />
          <span>Hedef Tamamlanmadı</span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day, idx) => (
          <div key={idx} className="text-center font-semibold text-sm text-gray-600 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500">Takvim yükleniyor...</div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => renderCell(cell, idx))}
        </div>
      )}
    </div>
  );
}
