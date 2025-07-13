import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { 
  getAvailableFieldOptions, 
  approveTeacherApplication, 
  approveTeacherApplicationWithFields, 
  rejectTeacherApplication,
  getAllTeacherApplications,
  getAllStudentApplications,
  approveStudentApplication,
  rejectStudentApplication
} from "@/db/queries";

// ✅ CONSOLIDATED ADMIN API: Replaces multiple admin endpoints
export async function GET(request: NextRequest) {
  try {
    // ✅ UNIFIED ADMIN AUTH: Single admin check instead of duplicated across routes
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'field-options': {
        // Get available field options
        const fieldOptions = await getAvailableFieldOptions();
        return NextResponse.json(fieldOptions);
      }

      case 'teacher-applications': {
        // Get all teacher applications
        console.log('[Admin API] Fetching teacher applications...');
        const applications = await getAllTeacherApplications();
        console.log('[Admin API] Found teacher applications:', applications.length);
        console.log('[Admin API] Sample application:', applications[0]);
        return NextResponse.json({ applications });
      }

      case 'student-applications': {
        // ✅ NEW: Get all student applications
        console.log('[Admin API] Fetching student applications...');
        const applications = await getAllStudentApplications();
        console.log('[Admin API] Found student applications:', applications.length);
        console.log('[Admin API] Sample application:', applications[0]);
        return NextResponse.json({ applications });
      }

      default: {
        return NextResponse.json({ 
          error: "Invalid action parameter. Supported actions: field-options, teacher-applications, student-applications" 
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error(`Error in admin GET ${request.url}:`, error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}

// POST handler for admin actions that modify data
export async function POST(request: NextRequest) {
  try {
    // ✅ UNIFIED ADMIN AUTH: Single admin check instead of duplicated across routes
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'approve-teacher': {
        // Approve teacher application
        const { applicationId, fields } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Application ID is required" }, { status: 400 });
        }

        let result;
        if (fields && fields.length > 0) {
          result = await approveTeacherApplicationWithFields(applicationId, fields);
        } else {
          result = await approveTeacherApplication(applicationId);
        }

        return NextResponse.json({ message: "Teacher application approved successfully", result });
      }

      case 'reject-teacher': {
        // Reject teacher application
        const { applicationId } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Application ID is required" }, { status: 400 });
        }

        await rejectTeacherApplication(applicationId);
        return NextResponse.json({ message: "Teacher application rejected successfully" });
      }

      case 'approve-student': {
        // ✅ NEW: Approve student application
        const { applicationId } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Application ID is required" }, { status: 400 });
        }

        await approveStudentApplication(applicationId);
        return NextResponse.json({ message: "Student application approved successfully" });
      }

      case 'reject-student': {
        // ✅ NEW: Reject student application
        const { applicationId } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Application ID is required" }, { status: 400 });
        }

        await rejectStudentApplication(applicationId);
        return NextResponse.json({ message: "Student application rejected successfully" });
      }

      default: {
        return NextResponse.json({ 
          error: "Invalid action parameter. Supported actions: approve-teacher, reject-teacher, approve-student, reject-student" 
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error(`Error in admin POST ${request.url}:`, error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
}

// PATCH handler for compatibility with existing teacher application routes
export async function PATCH(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // For PATCH requests, get ID from URL path if available
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: "Invalid application ID" }, { status: 400 });
    }

    const { action, selectedFields } = await request.json();
    const applicationId = parseInt(id);

    if (action === "approve") {
      if (selectedFields && selectedFields.length > 0) {
        await approveTeacherApplicationWithFields(applicationId, selectedFields);
      } else {
        await approveTeacherApplication(applicationId);
      }
      return NextResponse.json({ message: "Application approved successfully." });
    } else if (action === "reject") {
      await rejectTeacherApplication(applicationId);
      return NextResponse.json({ message: "Application rejected successfully." });
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in admin PATCH:", error);
    return NextResponse.json({ message: "An error occurred." }, { status: 500 });
  }
} 