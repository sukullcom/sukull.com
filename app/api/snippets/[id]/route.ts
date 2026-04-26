// app/api/snippets/[id]/route.ts

import { NextResponse } from "next/server";
import { getSnippetById } from "@/db/queries";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";

/**
 * GET /api/snippets/[id]
 *
 * ## Ownership model: PUBLIC pool (documented)
 *
 * This endpoint returns any snippet by id to any authenticated user.
 * That is intentional — the Code Editor is a shared library and
 * `getAllSnippets` already exposes the full paginated catalogue, so
 * filtering here by `userId` would not add a real confidentiality
 * boundary, it would only stop id-enumeration of data that is already
 * listable.
 *
 * If the product ever adds "private snippets" this endpoint MUST gate
 * on `isPublic` / viewer ownership at the query level (see
 * `db/queries/snippets.ts` for the long form). Until then, the 401
 * below is the only access gate (anonymous traffic is denied).
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    // Snippets are a PUBLIC pool (see `db/queries/snippets.ts` —
    // `getSnippetById` docblock). The list endpoint `/api/snippets`
    // already returns every saved snippet; we intentionally do NOT
    // filter by `userId` here. The only thing that matters at this
    // layer is bounding per-user read volume so a scraper can't
    // sidestep the list's `limit` cap by iterating ids one-by-one,
    // which the rate limiter below handles.
    //
    // ⚠ If a future "private snippet" flag is introduced, this route
    // must add `snippet.userId === user.id || snippet.isPublic`
    // filtering (see comment in queries/snippets.ts).
    const rl = await checkRateLimit({
      key: `snippetsReadById:user:${user.id}`,
      ...RATE_LIMITS.read,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek. Biraz sonra tekrar deneyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
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
