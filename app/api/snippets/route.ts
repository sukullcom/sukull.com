// app/api/snippets/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSnippetCount, createSnippet, getAllSnippets } from "@/db/queries";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { userProgress } from "@/db/schema";

// -- 1) GET route for listing all snippets (with optional search) --
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

// -- 2) POST route for creating a new snippet (this is your existing code) --
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userP = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: {
        userId: true,
        userName: true,
        points: true,
      },
    });

    // If userProgress row is not found
    if (!userP) {
      return NextResponse.json(
        { error: "User not found in user_progress table." },
        { status: 400 }
      );
    }

    // Check user has > 10k points
    if (userP.points < 10000) {
      return NextResponse.json(
        { error: "You do not have enough points to share a snippet." },
        { status: 403 }
      );
    }

    // Check user share count < 3
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

    // Insert snippet
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
