// app/api/protected/route.ts
import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebaseAdmin";

// Bu route'a "fetch" yaparken cookie içindeki 'token'ı headers'a koyabilirsiniz,
// veya session cookie'yi Node tarafında okursunuz (server actions gibi).
export async function GET(request: Request) {
  // Örnek: cookie'den token alalım
  const cookies = request.headers.get("cookie") || "";
  const tokenMatch = cookies.match(/token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  try {
    const decoded = await verifyIdToken(token);
    // Token geçerli, user uid:
    console.log("UID:", decoded.uid);
    return NextResponse.json({ message: "Protected content!" });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
}
