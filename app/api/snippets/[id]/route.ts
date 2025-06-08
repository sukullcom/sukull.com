// app/api/snippets/[id]/route.ts

import { NextResponse } from "next/server";
import { getSnippetById } from "@/db/queries";
import { getServerUser } from "@/lib/auth";

// Return a single snippet by ID - OPTIMIZED
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Add authentication check
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const snippetId = parseInt(params.id, 10);
    if (Number.isNaN(snippetId) || snippetId <= 0) {
      return NextResponse.json({ error: "Invalid snippet ID" }, { status: 400 });
    }

    const snippet = await getSnippetById(snippetId);
    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    return NextResponse.json(snippet);
  } catch (error) {
    console.error("Error in GET /api/snippets/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
