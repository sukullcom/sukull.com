import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin"
import { approveStudentApplication, rejectStudentApplication } from "@/db/queries"

export const PATCH = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  if (!(await isAdmin())) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { id } = params
    const { action } = await req.json()

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: "Invalid application ID" }, { status: 400 })
    }

    const applicationId = parseInt(id)

    if (action === "approve") {
      await approveStudentApplication(applicationId)
      return NextResponse.json({ message: "Application approved successfully" })
    } else if (action === "reject") {
      await rejectStudentApplication(applicationId)
      return NextResponse.json({ message: "Application rejected successfully" })
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating student application:", error)
    return NextResponse.json(
      { message: "An error occurred while updating the application" },
      { status: 500 }
    )
  }
} 