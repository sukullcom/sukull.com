import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getAvailableFieldOptions } from "@/db/queries";

export async function GET() {
  try {
    // Check if the user is an admin
    const admin = await isAdmin();
    
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get available field options
    const fieldOptions = await getAvailableFieldOptions();
    
    return NextResponse.json(fieldOptions, { status: 200 });
  } catch (error) {
    console.error("Error getting field options:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 