import { getCourses, getUserProgress, getSchools } from "@/db/queries";
import { List } from "./list";
import { SchoolSelector } from "./school-selector";

const CoursesPage = async () => {
  const [courses, userProgress, schools] = await Promise.all([
    getCourses(),
    getUserProgress(),
    getSchools(),
  ]);

  return (
    <div className="h-full max-w-[912px] px-6 mx-auto py-6">
      <div className="mb-6">
        <SchoolSelector schools={schools} userProgress={userProgress} />
      </div>
      <h1 className="text-3xl font-extrabold text-neutral-800 mb-6">
        Dersler
      </h1>
      <List courses={courses} activeCourseId={userProgress?.activeCourseId} />
    </div>
  );
};

export default CoursesPage;
