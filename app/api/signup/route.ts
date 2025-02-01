import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { token, displayName } = await req.json();
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

    // 4) create/update user in Drizzle
    const existing = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    const nameToUse = displayName || "User";

    if (!existing) {
      await db.insert(userProgress).values({
        userId,
        userName: nameToUse,
        // Always default to mascot_purple.svg at the beginning
        userImageSrc: "/mascot_purple.svg",
      });

      // Also create user doc in Firestore with default image
      const firestore = getFirestore();
      await firestore.collection("users").doc(userId).set({
        userName: nameToUse,
        userImageSrc: "/mascot_purple.svg",
        schoolId: null,
        createdAt: new Date(),
      });
    } else {
      // If userProgress row exists, just update displayName (if provided)
      if (displayName) {
        await db
          .update(userProgress)
          .set({ userName: displayName })
          .where(eq(userProgress.userId, userId));
      }

      // Also update Firestore user doc's displayName
      const firestore = getFirestore();
      await firestore
        .collection("users")
        .doc(userId)
        .set(
          {
            userName: nameToUse,
            updatedAt: new Date(),
          },
          { merge: true }
        );
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
