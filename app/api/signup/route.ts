// app/api/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { token, displayName, avatarUrl } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    // 1) verify the short-lived ID token
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.uid;

    // 2) create session cookie
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionCookie = await adminAuth.createSessionCookie(token, {
      expiresIn,
    });

    // 3) set session cookie in response
    const response = NextResponse.json({ success: true });
    response.cookies.set("token", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: expiresIn / 1000,
    });

    // 4) create / update user in Drizzle
    const existing = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    if (!existing) {
      await db.insert(userProgress).values({
        userId,
        userName: displayName || "User",
        userImageSrc: avatarUrl || "/mascot_purple.svg",
      });
    } else {
      if (displayName) {
        await db.update(userProgress).set({ userName: displayName }).where(eq(userProgress.userId, userId));
      }
    }

    return response;
  } catch (err: any) {
    console.error("/api/signup error:", err);
    return NextResponse.json(
      { error: "Sunucu hatası, lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
