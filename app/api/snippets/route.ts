// app/api/snippets/route.ts

import { NextResponse } from "next/server";
import { getAllSnippets, getUserSnippetCount, createSnippet } from "@/db/queries";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { userProgress } from "@/db/schema";
import { getServerUser } from "@/lib/auth";
import { checkStreakRequirement, getStreakRequirementMessage } from "@/utils/streak-requirements";

export async function GET(req: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
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
      limit: Math.min(limit, 50),
      offset 
    });
    
    return NextResponse.json({
      snippets,
      pagination: {
        page,
        limit,
        hasMore: snippets.length === limit,
      }
    });
  } catch (error) {
    console.error("Error in GET /api/snippets:", error);
    return NextResponse.json({ error: "Sunucu tarafında bir hata oluştu." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const userId = user.id;

    const userP = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: {
        userId: true,
        userName: true,
        istikrar: true,
        codeShareUnlocked: true,
      },
    });

    if (!userP) {
      return NextResponse.json(
        { error: "Kullanıcı ilerleme bilgisi bulunamadı." },
        { status: 400 }
      );
    }

    if (!checkStreakRequirement(userP.istikrar, "CODE_SNIPPET_SHARING", {
      codeShareUnlocked: userP.codeShareUnlocked
    })) {
      return NextResponse.json(
        { error: getStreakRequirementMessage("CODE_SNIPPET_SHARING") },
        { status: 403 }
      );
    }

    const count = await getUserSnippetCount(userId);
    if (count >= 3) {
      return NextResponse.json(
        { error: "En fazla 3 kod parçası paylaşabilirsiniz." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, code, language } = body;

    if (!title?.trim() || !description?.trim() || !code?.trim() || !language?.trim()) {
      return NextResponse.json(
        { error: "Tüm alanların (başlık, açıklama, kod, dil) doldurulması gerekiyor." },
        { status: 400 }
      );
    }

    if (title.trim().length > 100) {
      return NextResponse.json(
        { error: "Başlık en fazla 100 karakter olabilir." },
        { status: 400 }
      );
    }

    if (description.trim().length > 500) {
      return NextResponse.json(
        { error: "Açıklama en fazla 500 karakter olabilir." },
        { status: 400 }
      );
    }

    if (code.trim().length > 10000) {
      return NextResponse.json(
        { error: "Kod en fazla 10.000 karakter olabilir." },
        { status: 400 }
      );
    }

    await createSnippet({
      userId,
      userName: userP.userName || "Anonim",
      code: code.trim(),
      title: title.trim(),
      description: description.trim(),
      language: language.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in POST /api/snippets:", err);
    return NextResponse.json({ error: "Sunucu tarafında bir hata oluştu." }, { status: 500 });
  }
}
