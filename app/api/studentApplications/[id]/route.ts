import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin"
import { approveStudentApplication, rejectStudentApplication } from "@/db/queries"

export const PATCH = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Bu işlem için yetkiniz yok.", { status: 401 })
  }

  try {
    const { id } = params
    const { action } = await req.json()

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: "Geçersiz başvuru kimliği." }, { status: 400 })
    }

    const applicationId = parseInt(id)

    if (action === "approve") {
      await approveStudentApplication(applicationId)
      return NextResponse.json({ message: "Başvuru başarıyla onaylandı." })
    } else if (action === "reject") {
      await rejectStudentApplication(applicationId)
      return NextResponse.json({ message: "Başvuru reddedildi." })
    } else {
      return NextResponse.json({ message: "Geçersiz işlem." }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating student application:", error)
    return NextResponse.json(
      { message: "Başvuru güncellenirken bir hata oluştu." },
      { status: 500 }
    )
  }
}
