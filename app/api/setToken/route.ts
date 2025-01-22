// app/api/setToken/route.ts
import { NextRequest, NextResponse } from "next/server";

// Cookie seçenekleri
const cookieOptions = {
  name: "token",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  // sameSite: "strict", // dilediğiniz gibi
  maxAge: 60 * 60 * 24 * 7, // 1 hafta örneğin
};

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }
    // Burada token valid mi kontrol etmek isterseniz firebase-admin verify falan
    // AMA genelde middleware istemediğimiz için burayı basit tutuyoruz

    // Cookie ayarla
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
      // sameSite: "strict",
    });
    return response;
  } catch (error) {
    console.error("setToken error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
