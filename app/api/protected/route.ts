// app/api/protected/route.ts
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  // 1) Cookie'den "token" çek
  const cookies = request.headers.get("cookie") || "";
  const tokenMatch = cookies.match(/token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  try {
    // 2) Session cookie doğrula
    const decoded = await verifySessionCookie(token);
    // Token geçerli => user uid:
    console.log("UID:", decoded.uid);
    return NextResponse.json({ message: "Protected content!" });
  } catch (error) {
    // 3) Geçersiz/Expire vs => 403
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 403 });
  }
}
