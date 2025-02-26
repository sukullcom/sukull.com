import { redirect } from "next/navigation";
import { getCourses, getUserProgress } from "@/db/queries";
import { List } from "./list";
import { getServerUser } from "@/lib/auth";

export default async function CoursesPage() {

  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  // 2) Ardından veritabanı sorguları
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
}
