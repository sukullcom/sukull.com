import { getCourses } from "@/db/queries";
import { CourseBuilder } from "./course-builder";

export default async function CourseBuilderPage() {
  const courses = await getCourses();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kurs Oluşturucu</h1>
        <p className="text-gray-600 mt-2">
          Kurs, ünite, ders ve challenge oluştur ve düzenle.
        </p>
      </div>
      <CourseBuilder initialCourses={courses} />
    </div>
  );
}
