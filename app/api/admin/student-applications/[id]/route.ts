import { NextResponse } from "next/server";
import { approveStudentApplication, rejectStudentApplication } from "@/db/queries";
import { isAdmin } from "@/lib/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[Student Application] PATCH request for ID: ${params.id}`);
    
    // Check if the user is an admin
    const admin = await isAdmin();
    
    if (!admin) {
      console.log("[Student Application] Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { action } = await request.json();
    
    console.log(`[Student Application] Action: ${action} for application ID: ${id}`);
    
    if (!id || isNaN(parseInt(id))) {
      console.log(`[Student Application] Invalid ID: ${id}`);
      return NextResponse.json({ message: "Invalid application ID" }, { status: 400 });
    }

    const applicationId = parseInt(id);

    if (action === "approve") {
      console.log(`[Student Application] Approving application ${applicationId}`);
      try {
        const result = await approveStudentApplication(applicationId);
        console.log(`[Student Application] Approval successful:`, result);
        return NextResponse.json({ message: "Student application approved successfully." }, { status: 200 });
      } catch (error) {
        console.error(`[Student Application] Error during approval:`, error);
        throw error;
      }
    } else if (action === "reject") {
      console.log(`[Student Application] Rejecting application ${applicationId}`);
      try {
        const result = await rejectStudentApplication(applicationId);
        console.log(`[Student Application] Rejection successful:`, result);
        return NextResponse.json({ message: "Student application rejected successfully." }, { status: 200 });
      } catch (error) {
        console.error(`[Student Application] Error during rejection:`, error);
        throw error;
      }
    } else {
      console.log(`[Student Application] Invalid action: ${action}`);
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Student Application] Error updating student application:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 