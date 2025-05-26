import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";

export async function GET() {
  try {
    // Add authentication check
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get all users with teacher role
    const teachers = await db.query.users.findMany({
      where: eq(users.role, "teacher"),
      columns: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        description: true,
        meetLink: true,
      },
    });
    
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