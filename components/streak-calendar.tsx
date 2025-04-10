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
      
      // Important: Properly convert Date objects to ISO strings before setting state
      const formattedRecs = recs.map(rec => {
        // Extract date part only for accurate comparison
        const dateObj = new Date(rec.date);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        // Debug date conversion
        console.log(`Record: ${rec.id}, Date: ${dateStr}, Achieved: ${rec.achieved}`);
        
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
      // Debug matching
      console.log(`Day ${cell.day}: Cell date ${cell.date}, Record found - achieved: ${achieved}`);
    } else {
      // Debug no match
      console.log(`Day ${cell.day}: Cell date ${cell.date}, No record found`);
    }
    
    // If the selected month is the current month and this day is in the future, force achieved = false.
    if (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      cell.day > now.getDate()
    ) {
      achieved = false;
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
        <Button variant="sidebarOutline" onClick={handleNextMonth} disabled={isNextDisabled}>
          {">"}
        </Button>
      </div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day, idx) => (
          <div key={idx} className="text-center font-semibold text-sm">{day}</div>
        ))}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => renderCell(cell, idx))}
        </div>
      )}
    </div>
  );
}
