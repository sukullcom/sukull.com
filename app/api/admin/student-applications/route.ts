import { NextResponse } from "next/server";
import { getAllStudentApplications } from "@/db/queries";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  try {
    // Check if the user is an admin
    const admin = await isAdmin();
    
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get all student applications
    const applications = await getAllStudentApplications();
    
    return NextResponse.json({ applications }, { status: 200 });
  } catch (error) {
    console.error("Error getting student applications:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 