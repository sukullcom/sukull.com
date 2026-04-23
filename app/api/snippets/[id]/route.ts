// app/api/snippets/[id]/route.ts

import { NextResponse } from "next/server";
import { getSnippetById } from "@/db/queries";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const snippetId = parseInt(params.id, 10);
    if (Number.isNaN(snippetId) || snippetId <= 0) {
      return NextResponse.json({ error: "Geçersiz kod parçası kimliği." }, { status: 400 });
    }

    const snippet = await getSnippetById(snippetId);
    if (!snippet) {
      return NextResponse.json({ error: "Kod parçası bulunamadı." }, { status: 404 });
    }

    return NextResponse.json(snippet);
  } catch (error) {
    {
      const log = await getRequestLogger({ labels: { route: "api/snippets/[id]" } });
      log.error({ message: "snippet by id failed", error, location: "api/snippets/[id]/GET" });
    }
    return NextResponse.json({ error: "Sunucu tarafında bir hata oluştu." }, { status: 500 });
  }
}
