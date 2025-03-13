import { redirect } from "next/navigation";
import { getCourses, getUserProgress } from "@/db/queries";
import { List } from "./list";
import { getServerUser } from "@/lib/auth";

// Add ISR for the courses page
export const revalidate = 3600; // Revalidate once per hour

export default async function CoursesPage() {
  try {
    const user = await getServerUser();
    if (!user) {
      redirect("/login");
    }

    // Fetch data in parallel for better performance
    const [courses, userProgress] = await Promise.all([
      getCourses(),
      getUserProgress(), // userProgress'i userId üzerinden alacak
    ]);

    return (
      <div className="h-full max-w-[912px] px-6 mx-auto py-6">
        <h1 className="text-3xl font-extrabold text-neutral-800 mb-6">Dersler</h1>
        <List courses={courses} activeCourseId={userProgress?.activeCourseId} />
      </div>
    );
  } catch (error) {
    console.error("Error in courses page:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Bir Hata Oluştu</h1>
        <p>Dersler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
      </div>
    );
  }
}
