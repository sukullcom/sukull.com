import { getCourses } from "@/db/queries";
import { CourseBuilder } from "./course-builder";
import { MathRenderer } from "@/components/ui/math-renderer";

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

        {/* Quick LaTeX Test */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold mb-2">🧪 LaTeX Test (Remove after testing):</h3>
          <div className="space-y-2">
            <div>Simple: <MathRenderer>{"$x = 2$"}</MathRenderer></div>
            <div>Complex: <MathRenderer>{"$$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$"}</MathRenderer></div>
          </div>
        </div>

        <CourseBuilder initialCourses={courses} />
      </div>
    </div>
  );
} 