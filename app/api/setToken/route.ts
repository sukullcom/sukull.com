// app/api/setToken/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    // create session cookie from the ID token
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn });

    const response = NextResponse.json({ success: true });
    response.cookies.set("token", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: expiresIn / 1000,
    });
    return response;
  } catch (error) {
    console.error("setToken error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
