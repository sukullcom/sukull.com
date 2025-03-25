import { NextResponse } from "next/server";
import { approveStudentApplication, rejectStudentApplication } from "@/db/queries";
import { isAdmin } from "@/lib/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is an admin
    const admin = await isAdmin();
    
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { action } = await request.json();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: "Invalid application ID" }, { status: 400 });
    }

    const applicationId = parseInt(id);

    if (action === "approve") {
      await approveStudentApplication(applicationId);
      return NextResponse.json({ message: "Application approved successfully." }, { status: 200 });
    } else if (action === "reject") {
      await rejectStudentApplication(applicationId);
      return NextResponse.json({ message: "Application rejected successfully." }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating student application:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 