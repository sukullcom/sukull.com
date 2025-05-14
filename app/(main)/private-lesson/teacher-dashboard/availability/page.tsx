import { redirect } from 'next/navigation';
import { getCurrentTeacherAvailability, isTeacher } from '@/db/queries';
import { getServerUser } from '@/lib/auth';
import AvailabilityPageClient from './client';

export default async function TeacherAvailabilityPage() {
  const user = await getServerUser();
  
  // If not logged in, redirect to login
  if (!user) {
    redirect('/login');
  }
  
  // Check if user is a teacher using the isTeacher function
  const userIsTeacher = await isTeacher(user.id);
  
  // If not a teacher, redirect to private lessons page
  if (!userIsTeacher) {
    redirect('/private-lesson');
  }
  
  // Use today's date as the week start date
  const weekStartDate = new Date();
  // Reset time to beginning of day
  weekStartDate.setHours(0, 0, 0, 0);
  
  // Get current availability
  const availability = await getCurrentTeacherAvailability(user.id);
  
  // Convert Date objects to ISO strings for client component
  const serializedAvailability = availability.map(slot => ({
    ...slot,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    weekStartDate: slot.weekStartDate.toISOString(),
    createdAt: slot.createdAt.toISOString(),
    updatedAt: slot.updatedAt.toISOString()
  }));
  
  // Calculate next Friday for the info message
  const now = new Date();
  const daysUntilNextFriday = (5 - now.getDay() + 7) % 7 || 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilNextFriday);
  
  const nextFridayFormatted = nextFriday.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long'
  });
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Müsait Olduğunuz Zamanları Belirleyin</h1>
      <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded-md">
        <h2 className="text-lg font-medium text-blue-800 mb-2">Önemli Bilgi</h2>
        <p className="text-blue-700">
          Bugünden başlayarak <strong>{nextFridayFormatted}</strong> günü saat 23:59&apos;a kadar olan müsait zamanlarınızı belirleyebilirsiniz.
          Geçmiş saatler veya bu zaman aralığı dışındaki günler için seçim yapamazsınız.
        </p>
      </div>
      <p className="mb-6 text-gray-600">
        Öğrencilere özel ders vermek için müsait olduğunuz zamanları seçin. Öğrenciler bu zaman dilimlerinden birini seçerek sizinle özel ders planlayabilirler.
      </p>
      
      <AvailabilityPageClient 
        weekStartDate={weekStartDate.toISOString()} 
        initialAvailability={serializedAvailability} 
      />
    </div>
  );
} 