import { NextRequest } from "next/server";
import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { getTeachersWithRatings } from "@/db/queries";

export const GET = secureApi.auth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const fieldFilter = searchParams.get("field");
    const subject = searchParams.get("subject");
    const grade = searchParams.get("grade");

    const teachers = await getTeachersWithRatings();
    
    let filteredTeachers = teachers;
    
    if (fieldFilter && fieldFilter !== "all") {
      filteredTeachers = filteredTeachers.filter(teacher => {
        return teacher.fields && teacher.fields.some(field => 
          field.toLowerCase().includes(fieldFilter.toLowerCase())
        );
      });
    }

    if (subject) {
      filteredTeachers = filteredTeachers.filter(teacher => {
        return teacher.fields && teacher.fields.some(field => 
          field.toLowerCase().includes(subject.toLowerCase())
        );
      });
    }

    if (grade) {
      filteredTeachers = filteredTeachers.filter(teacher => {
        return teacher.fields && teacher.fields.some(field => 
          field.toLowerCase().includes(grade.toLowerCase())
        );
      });
    }
    
    return ApiResponses.success({ 
      teachers: filteredTeachers,
      count: filteredTeachers.length
    });
  } catch (error) {
    console.error("Error fetching available teachers:", error);
    return ApiResponses.serverError("An error occurred while fetching teachers");
  }
});
