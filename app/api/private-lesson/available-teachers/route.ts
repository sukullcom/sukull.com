import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getTeachersWithRatings } from "@/db/queries";

export async function GET(request: Request) {
  try {
    // Add authentication check
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const fieldFilter = searchParams.get('field');

    // Get all teachers with ratings
    let teachers = await getTeachersWithRatings();
    
    // Apply field filter if provided
    if (fieldFilter && fieldFilter !== 'all') {
      teachers = teachers.filter(teacher => {
        // Check if the teacher has this field in their fields array
        return teacher.fields && teacher.fields.some(field => 
          field.toLowerCase().includes(fieldFilter.toLowerCase())
        );
      });
    }
    
    // Return the list of teachers
    return NextResponse.json({ 
      teachers,
      count: teachers.length
    });
  } catch (error) {
    console.error("Error fetching available teachers:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
} 