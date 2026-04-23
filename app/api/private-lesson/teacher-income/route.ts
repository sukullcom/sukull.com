import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getTeacherIncome, isTeacher } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ message: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }
    
    const userIsTeacher = await isTeacher(user.id);
    
    if (!userIsTeacher) {
      return NextResponse.json({ message: "Gelir verilerine yalnızca eğitmenler erişebilir" }, { status: 403 });
    }
    
    const incomeData = await getTeacherIncome(user.id);
    
    return NextResponse.json(incomeData);
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/private-lesson/teacher-income" } }))
      .error({ message: "fetch teacher income failed", error, location: "api/private-lesson/teacher-income" });
    return NextResponse.json({ 
      message: "Gelir verileri yüklenirken bir hata oluştu" 
    }, { status: 500 });
  }
}
