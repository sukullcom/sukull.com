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

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'field-options': {
        const fieldOptions = await getAvailableFieldOptions();
        return NextResponse.json(fieldOptions);
      }

      case 'teacher-applications': {
        const applications = await getAllTeacherApplications();
        return NextResponse.json({ applications });
      }

      case 'student-applications': {
        const applications = await getAllStudentApplications();
        return NextResponse.json({ applications });
      }

      default: {
        return NextResponse.json({ 
          error: "Geçersiz istek parametresi." 
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error(`Error in admin GET ${request.url}:`, error);
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'approve-teacher': {
        const { applicationId, fields } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Başvuru kimliği gereklidir." }, { status: 400 });
        }

        let result;
        if (fields && fields.length > 0) {
          result = await approveTeacherApplicationWithFields(applicationId, fields);
        } else {
          result = await approveTeacherApplication(applicationId);
        }

        return NextResponse.json({ message: "Öğretmen başvurusu başarıyla onaylandı.", result });
      }

      case 'reject-teacher': {
        const { applicationId } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Başvuru kimliği gereklidir." }, { status: 400 });
        }

        await rejectTeacherApplication(applicationId);
        return NextResponse.json({ message: "Öğretmen başvurusu reddedildi." });
      }

      case 'approve-student': {
        const { applicationId } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Başvuru kimliği gereklidir." }, { status: 400 });
        }

        await approveStudentApplication(applicationId);
        return NextResponse.json({ message: "Öğrenci başvurusu başarıyla onaylandı." });
      }

      case 'reject-student': {
        const { applicationId } = body;
        
        if (!applicationId) {
          return NextResponse.json({ message: "Başvuru kimliği gereklidir." }, { status: 400 });
        }

        await rejectStudentApplication(applicationId);
        return NextResponse.json({ message: "Öğrenci başvurusu reddedildi." });
      }

      default: {
        return NextResponse.json({ 
          error: "Geçersiz istek parametresi." 
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error(`Error in admin POST ${request.url}:`, error);
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 401 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: "Geçersiz başvuru kimliği." }, { status: 400 });
    }

    const { action, selectedFields } = await request.json();
    const applicationId = parseInt(id);

    if (action === "approve") {
      if (selectedFields && selectedFields.length > 0) {
        await approveTeacherApplicationWithFields(applicationId, selectedFields);
      } else {
        await approveTeacherApplication(applicationId);
      }
      return NextResponse.json({ message: "Başvuru başarıyla onaylandı." });
    } else if (action === "reject") {
      await rejectTeacherApplication(applicationId);
      return NextResponse.json({ message: "Başvuru reddedildi." });
    } else {
      return NextResponse.json({ message: "Geçersiz işlem." }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in admin PATCH:", error);
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}
