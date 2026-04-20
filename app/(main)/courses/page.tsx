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
      <div className="h-full max-w-[960px] px-4 sm:px-6 mx-auto py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-800">
            Ne öğrenmek istersin?
          </h1>
          <p className="text-neutral-400 text-sm mt-2">
            Okul derslerinden veya sınav hazırlığından başla
          </p>
        </div>
        <List courses={courses} activeCourseId={userProgress?.activeCourseId} />
      </div>
    );
  } catch (error) {
    console.error("Error in courses page:", error);
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <h1 className="text-xl font-bold mb-3 text-neutral-800">Bir Hata Oluştu</h1>
        <p className="text-neutral-500">Dersler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }
}
