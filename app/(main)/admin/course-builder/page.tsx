import { getCourses } from "@/db/queries";
import { CourseBuilder } from "./course-builder";
import { MathTest } from "@/components/ui/math-test";

export default async function CourseBuilderPage() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Course Builder</h1>
          <p className="text-gray-600 mt-2">
            Create and manage courses, units, lessons, and challenges
          </p>
        </div>

        {/* Temporary: Math rendering test */}
        <div className="mb-6">
          <MathTest />
        </div>

        <CourseBuilder initialCourses={courses} />
      </div>
    </div>
  );
} 