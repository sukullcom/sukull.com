'use client';

import { useState, useEffect } from 'react';
import TimeSlotGrid from '@/app/components/teacher-availability/TimeSlotGrid';
import { toast } from 'sonner';

type AvailabilityPageClientProps = {
  weekStartDate: string; // Now accepting ISO string instead of Date
  initialAvailability: Array<{
    id: number;
    teacherId: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    dayOfWeek: number;
    weekStartDate: string; // ISO string
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
  }>;
};

export default function AvailabilityPageClient({ 
  weekStartDate, 
  initialAvailability 
}: AvailabilityPageClientProps) {
  // Parse the ISO string to Date objects
  const weekStartDateObj = new Date(weekStartDate);
  
  // Convert the string dates to the format expected by TimeSlotGrid (with string dates, not Date objects)
  const [formattedAvailability, setFormattedAvailability] = useState(initialAvailability.map(slot => ({
    startTime: slot.startTime, // Keep as string
    endTime: slot.endTime, // Keep as string
    dayOfWeek: slot.dayOfWeek
  })));

  // Fetch the latest availability when the component mounts
  useEffect(() => {
    const fetchLatestAvailability = async () => {
      try {
        const response = await fetch('/api/teacher-availability');
        if (response.ok) {
          const data = await response.json();
          if (data.availability && Array.isArray(data.availability)) {
            const latest = data.availability.map((slot: {
              startTime: string;
              endTime: string;
              dayOfWeek: number;
            }) => ({
              startTime: slot.startTime, // Keep as string
              endTime: slot.endTime, // Keep as string
              dayOfWeek: slot.dayOfWeek
            }));
            setFormattedAvailability(latest);
          }
        }
      } catch (error) {
        console.error('Error fetching latest availability:', error);
        toast.error('Müsait zamanlarınız yüklenirken bir hata oluştu.');
      }
    };

    fetchLatestAvailability();
  }, []);
  
  // Calculate next Friday
  const now = new Date();
  const daysUntilNextFriday = (5 - now.getDay() + 7) % 7 || 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilNextFriday);
  
  return (
    <div>
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Uygunluk Takvimi</h2>
        <ul className="list-disc ml-5 text-sm text-gray-600">
          <li>Yeşil kutucuklar seçtiğiniz müsait zamanları gösterir</li>
          <li>Geçmiş zamanlar otomatik olarak devre dışı bırakılır</li>
          <li>Zamanlar 30 dakikalık dilimler halinde gösterilmektedir</li>
        </ul>
      </div>
      
      <TimeSlotGrid 
        weekStartDate={weekStartDateObj} 
        initialSelectedSlots={formattedAvailability} 
      />
      
      <div className="mt-6 bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <h3 className="font-bold text-yellow-800 mb-2">Önemli Hatırlatma</h3>
        <p className="text-yellow-700">
          Öğrenciler ders başlama süresinden 24 saat öncesine kadar 
          ders iptali yapabilirler.
        </p>
      </div>
    </div>
  );
} 