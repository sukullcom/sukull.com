// components/StreakCalendarAdvanced.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getUserDailyStreakForMonth } from "@/actions/daily-streak";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { addMonths, startOfMonth, endOfMonth, getDay, format } from "date-fns";

interface DailyRecord {
  id: number;
  date: string;
  achieved: boolean;
}

interface StreakCalendarAdvancedProps {
  startDate: string;
}

/**
 * Utility function to create UTC date string in YYYY-MM-DD format
 * This ensures consistency with database UTC dates
 */
function createUTCDateString(year: number, month: number, day: number): string {
  const utcDate = new Date(Date.UTC(year, month, day));
  return utcDate.toISOString().split('T')[0];
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
      console.log("📅 CALENDAR: Fetching streak records for", format(date, "MMMM yyyy"));
      const month = date.getMonth();  // Month should be 0-11 (JS Date standard)
      const year = date.getFullYear();
      const recs = await getUserDailyStreakForMonth(month, year);
      
      console.log("📅 CALENDAR: Received", recs.length, "records:", recs);
      
      // Important: Properly convert Date objects to ISO strings before setting state
      const formattedRecs = recs.map(rec => {
        // Extract date part only for accurate comparison
        const dateObj = new Date(rec.date);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        return {
          ...rec,
          date: dateStr
        };
      });
      
      console.log("📅 CALENDAR: Formatted records:", formattedRecs);
      setRecords(formattedRecs);
    } catch (err) {
      console.error("📅 CALENDAR: Failed to fetch daily streak records:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(selectedDate);
  }, [selectedDate]);

  // 🎯 NEW: Force refresh when startDate prop changes (when user data updates)
  useEffect(() => {
    fetchRecords(selectedDate);
  }, [startDate, selectedDate]);

  // 🎯 NEW: Add visibility change listener to refresh data when user returns to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again - refresh current month data
        console.log("📅 CALENDAR: Refetching streak records due to visibility change");
        fetchRecords(selectedDate);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedDate]);

  // 🎯 NEW: Add manual refresh function
  const handleRefresh = () => {
    console.log("📅 CALENDAR: Manual refresh triggered");
    fetchRecords(selectedDate);
  };

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
  // Fill in days of the month using UTC dates for consistency
  for (let d = 1; d <= daysInMonth; d++) {
    // ✅ FIX: Use UTC dates to match database dates
    const dateStr = createUTCDateString(selectedDate.getFullYear(), selectedDate.getMonth(), d);
    cells.push({ day: d, date: dateStr });
  }
  // Pad remaining cells so that the grid is complete
  while (cells.length % 7 !== 0) {
    cells.push({});
  }

  // Weekday headers
  const weekdays = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  // Render a single cell. For each day:
  // - If cell.date exists, check if a record exists. If yes, use its achieved value.
  // - If the cell represents a future day in the current month (and selected month is current), always show gray star.
  const renderCell = (cell: { day?: number; date?: string }, index: number) => {
    if (!cell.day || !cell.date) {
      return <div key={index} className="w-10 h-10"></div>;
    }
    
    let achieved = false;
    const record = records.find(r => r.date === cell.date);
    
    if (record) {
      achieved = record.achieved;
      console.log(`📅 CALENDAR: Date ${cell.date} found in records with achieved=${achieved}`);
    } else {
      console.log(`📅 CALENDAR: Date ${cell.date} NOT found in records`);
    }
    
    // ✅ FIX: Use UTC dates for consistent future day detection
    const currentUTCDate = createUTCDateString(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    
    // If the selected month is the current month and this day is in the future, force achieved = false.
    if (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      cell.date > currentUTCDate
    ) {
      achieved = false;
      console.log(`📅 CALENDAR: Date ${cell.date} is in the future (after ${currentUTCDate}), forcing achieved=false`);
    }
    
    return (
      <div key={index} className="w-10 h-12 flex flex-col items-center justify-center border border-gray-200 rounded-lg p-1 m-1">
        <span className="text-xs">{cell.day}</span>
        <Image
          width={20}
          height={20}
          src={achieved ? "/istikrar.svg" : "/istikrarsiz.svg"}
          alt={achieved ? "Achieved" : "Not achieved"}
          className="w-5 h-5 mt-1"
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="sidebarOutline" onClick={handlePrevMonth} disabled={isPrevDisabled}>
          {"<"}
        </Button>
        <div className="text-xl font-bold">
          {format(selectedDate, "MMMM yyyy")}
        </div>
        <div className="flex items-center gap-2">
          {/* 🎯 NEW: Manual refresh button */}
          <Button
            variant="sidebarOutline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            title="Takvimi yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="sidebarOutline" onClick={handleNextMonth} disabled={isNextDisabled}>
            {">"}
          </Button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => renderCell(cell, index))}
      </div>

      {loading && (
        <div className="text-center mt-4 text-sm text-gray-500">
          Yükleniyor...
        </div>
      )}
    </div>
  );
}
