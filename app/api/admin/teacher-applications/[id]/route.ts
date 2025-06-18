import { NextResponse } from "next/server";
import { approveTeacherApplication, approveTeacherApplicationWithFields, rejectTeacherApplication } from "@/db/queries";
import { isAdmin } from "@/lib/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[Teacher Application] PATCH request for ID: ${params.id}`);
    
    // Check if the user is an admin
    const admin = await isAdmin();
    
    if (!admin) {
      console.log("[Teacher Application] Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { action, selectedFields } = await request.json();
    
    console.log(`[Teacher Application] Action: ${action} for application ID: ${id}`);
    console.log(`[Teacher Application] Selected fields:`, selectedFields);
    
    if (!id || isNaN(parseInt(id))) {
      console.log(`[Teacher Application] Invalid ID: ${id}`);
      return NextResponse.json({ message: "Invalid application ID" }, { status: 400 });
    }

    const applicationId = parseInt(id);

    if (action === "approve") {
      console.log(`[Teacher Application] Approving application ${applicationId}`);
      try {
        let result;
        
        // Use new field-based approval if fields are provided
        if (selectedFields && selectedFields.length > 0) {
          result = await approveTeacherApplicationWithFields(applicationId, selectedFields);
        } else {
          // Fallback to legacy approval
          result = await approveTeacherApplication(applicationId);
        }
        
        console.log(`[Teacher Application] Approval successful:`, result);
        return NextResponse.json({ message: "Application approved successfully." }, { status: 200 });
      } catch (error) {
        console.error(`[Teacher Application] Error during approval:`, error);
        throw error;
      }
    } else if (action === "reject") {
      console.log(`[Teacher Application] Rejecting application ${applicationId}`);
      try {
        const result = await rejectTeacherApplication(applicationId);
        console.log(`[Teacher Application] Rejection successful:`, result);
        return NextResponse.json({ message: "Application rejected successfully." }, { status: 200 });
      } catch (error) {
        console.error(`[Teacher Application] Error during rejection:`, error);
        throw error;
      }
    } else {
      console.log(`[Teacher Application] Invalid action: ${action}`);
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Teacher Application] Error updating teacher application:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 