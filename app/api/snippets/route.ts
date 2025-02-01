// app/api/snippets/route.ts

import { NextResponse } from "next/server";
import { getAllSnippets, getUserSnippetCount, createSnippet } from "@/db/queries";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { userProgress } from "@/db/schema";
import { getServerUser } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;

  try {
    const snippets = await getAllSnippets({ search });
    return NextResponse.json(snippets);
  } catch (error) {
    console.error("Error in GET /api/snippets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.uid;

    const userP = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: {
        userId: true,
        userName: true,
        points: true,
      },
    });

    if (!userP) {
      return NextResponse.json(
        { error: "User not found in user_progress table." },
        { status: 400 }
      );
    }

    if (userP.points < 5000) {
      return NextResponse.json(
        { error: "You need to have 5000 points to share a snippet." },
        { status: 403 }
      );
    }

    const count = await getUserSnippetCount(userId);
    if (count >= 3) {
      return NextResponse.json(
        { error: "You have already shared 3 snippets." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, code, language } = body;

    if (!title || !description || !code || !language) {
      return NextResponse.json(
        { error: "Missing fields for snippet." },
        { status: 400 }
      );
    }

    await createSnippet({
      userId,
      userName: userP.userName || "Anonymous",
      code,
      title,
      description,
      language,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in POST /api/snippets:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
