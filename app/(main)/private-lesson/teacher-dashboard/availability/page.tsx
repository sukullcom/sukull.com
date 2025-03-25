import { redirect } from 'next/navigation';
import { getWeekStartDate, getCurrentTeacherAvailability, isTeacher } from '@/db/queries';
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
  
  // Get the current week's start date
  const weekStartDate = getWeekStartDate(new Date());
  
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
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Müsait Olduğunuz Zamanları Belirleyin</h1>
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