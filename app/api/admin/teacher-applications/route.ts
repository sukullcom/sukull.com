import { NextResponse } from "next/server";
import { getAllTeacherApplications } from "@/db/queries";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  try {
    // Check if the user is an admin
    const admin = await isAdmin();
    
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get all teacher applications
    const applications = await getAllTeacherApplications();
    
    return NextResponse.json({ applications }, { status: 200 });
  } catch (error) {
    console.error("Error getting teacher applications:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 