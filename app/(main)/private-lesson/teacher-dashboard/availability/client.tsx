'use client';

import { useState, useEffect } from 'react';
import TimeSlotGrid from '@/app/components/teacher-availability/TimeSlotGrid';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
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
  
  // Format the date range for display
  const weekEndDate = new Date(weekStartDateObj);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  
  const dateRangeStr = `${format(weekStartDateObj, 'd MMMM', { locale: tr })} - ${format(weekEndDate, 'd MMMM yyyy', { locale: tr })}`;
  
  return (
    <div>
      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Bu Hafta ({dateRangeStr})</h2>
        <p className="text-gray-600">
          Aşağıdan, bu haftaki müsait olduğunuz zamanları seçebilirsiniz. Yeşil kutucuklar seçtiğiniz zaman dilimlerini gösterir.
          Geçmiş günler ve saatler için seçim yapamazsınız.
        </p>
      </div>
      
      <TimeSlotGrid 
        weekStartDate={weekStartDateObj} 
        initialSelectedSlots={formattedAvailability} 
      />
      
      <div className="mt-6 bg-yellow-50 p-4 rounded border border-yellow-200">
        <h3 className="font-bold mb-2">Bilgi</h3>
        <p>
          Her hafta yeni müsait saatleri belirlemeniz gerekmektedir. Hafta sonunda tüm müsait saatleriniz sıfırlanacaktır.
          Bir öğrenci sizden özel ders talep ettiğinde, seçtiği zaman dilimi için bir bildirim alacaksınız.
        </p>
      </div>
    </div>
  );
} 