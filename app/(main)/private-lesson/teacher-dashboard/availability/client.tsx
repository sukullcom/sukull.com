'use client';

import React, { useState, useEffect } from 'react';
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

  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Check profile completion when the component mounts
  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        const response = await fetch('/api/teacher-availability/check-profile');
        if (!response.ok && response.status === 400) {
          const data = await response.json();
          setProfileIncomplete(true);
          setMissingFields(data.missingFields || []);
        } else {
          setProfileIncomplete(false);
          setMissingFields([]);
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    };

    checkProfileCompletion();
  }, []);

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
      {profileIncomplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Profil Bilgilerinizi Tamamlayın
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>Müsaitlik bilgilerinizi düzenleyebilmek için önce aşağıdaki bilgileri tamamlamanız gerekiyor:</p>
                <ul className="list-disc list-inside mt-2">
                  {missingFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    onClick={() => window.location.href = "/private-lesson/teacher-dashboard"}
                    className="bg-amber-50 px-2 py-1.5 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600"
                  >
                    Profil Sayfasına Git
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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