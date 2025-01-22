// app/api/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebaseAdmin";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { token, displayName, avatarUrl } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    const decoded = await verifyIdToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.uid;

    // Cookie set
    const response = NextResponse.json({ success: true });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // userProgress oluştur (veya varsa dokunma)
    const existing = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });

    if (!existing) {
      // yeni kayıt
      await db.insert(userProgress).values({
        userId,
        userName: displayName || "User",
        userImageSrc: avatarUrl || "/mascot_purple.svg",
      });
    } else {
      // var olan userProgress => userImageSrc güncellemiyoruz
      // userName güncelleyebilirsiniz (isteğe bağlı)
      if (displayName) {
        await db.update(userProgress)
          .set({ userName: displayName })
          .where(eq(userProgress.userId, userId));
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
