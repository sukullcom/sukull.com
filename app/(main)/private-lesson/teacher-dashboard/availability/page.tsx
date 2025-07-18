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
  
  // Get the start of the current week (Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Adjust to get Monday
  startOfWeek.setHours(0, 0, 0, 0);

  // Calculate the next Friday's date for display purposes
  const nextFriday = new Date(startOfWeek);
  nextFriday.setDate(startOfWeek.getDate() + 4); // Friday is 4 days after Monday
  
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
        initialAvailability={serializedAvailability} 
      />
    </div>
  );
} 