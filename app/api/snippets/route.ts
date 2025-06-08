// app/api/snippets/route.ts

import { NextResponse } from "next/server";
import { getAllSnippets, getUserSnippetCount, createSnippet } from "@/db/queries";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { userProgress } from "@/db/schema";
import { getServerUser } from "@/lib/auth";

export async function GET(req: Request) {
  // Add authentication check
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const language = searchParams.get("language") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  try {
    const snippets = await getAllSnippets({ 
      search, 
      language, 
      limit: Math.min(limit, 50), // Max 50 per request
      offset 
    });
    
    return NextResponse.json({
      snippets,
      pagination: {
        page,
        limit,
        hasMore: snippets.length === limit, // Simple check if there might be more
      }
    });
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

    const userId = user.id;

    // Validate user exists and has enough points
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

    // Check snippet limit
    const count = await getUserSnippetCount(userId);
    if (count >= 3) {
      return NextResponse.json(
        { error: "You have already shared 3 snippets." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, code, language } = body;

    // Enhanced input validation
    if (!title?.trim() || !description?.trim() || !code?.trim() || !language?.trim()) {
      return NextResponse.json(
        { error: "All fields (title, description, code, language) are required." },
        { status: 400 }
      );
    }

    // Length validation
    if (title.trim().length > 100) {
      return NextResponse.json(
        { error: "Title must be 100 characters or less." },
        { status: 400 }
      );
    }

    if (description.trim().length > 500) {
      return NextResponse.json(
        { error: "Description must be 500 characters or less." },
        { status: 400 }
      );
    }

    if (code.trim().length > 10000) {
      return NextResponse.json(
        { error: "Code must be 10,000 characters or less." },
        { status: 400 }
      );
    }

    await createSnippet({
      userId,
      userName: userP.userName || "Anonymous",
      code: code.trim(),
      title: title.trim(),
      description: description.trim(),
      language: language.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in POST /api/snippets:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
