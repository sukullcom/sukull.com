import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isTeacher, isApprovedStudent } from "@/db/queries";

export default async function PrivateLessonPage() {
  const user = await getServerUser();
  
  // Redirect to login if not logged in
  if (!user) {
    redirect("/login");
  }
  
  // Check user role directly from the database
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });
  
  // Check if user is a teacher by role
  if (userRecord?.role === "teacher") {
    redirect("/private-lesson/teacher-dashboard/bookings");
  }
  
  // If not a teacher by role, check if they have an approved student application
  const isStudent = await isApprovedStudent(user.id);
  
  if (isStudent) {
    redirect("/private-lesson/my-bookings");
  }
  
  // Only show this UI if user is neither a teacher nor a student
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10">Özel Dersler</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-semibold mb-4">Öğretmen Olmak İster misiniz?</h2>
            <p className="text-gray-600 mb-6">
              Bilgi ve deneyiminizi paylaşın, öğrencilere yardımcı olun ve ek gelir elde edin.
            </p>
            <Button 
              asChild
              variant="primary"
            >
              <a href="/private-lesson/give">Öğretmen Başvurusu Yap</a>
            </Button>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-semibold mb-4">Ders Almak İster misiniz?</h2>
            <p className="text-gray-600 mb-6">
              Alanında uzman öğretmenlerden özel ders alarak akademik başarınızı artırın.
            </p>
            <Button 
              asChild
              variant="primary"
            >
              <a href="/private-lesson/get">Öğrenci Başvurusu Yap</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
