// app/api/snippets/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAllSnippets, getUserSnippetCount, createSnippet } from "@/db/queries";
import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { userProgress } from "@/db/schema";
import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit-db";
import { checkStreakRequirement, getStreakRequirementMessage } from "@/utils/streak-requirements";
import { getRequestLogger } from "@/lib/logger";

/**
 * Reads are per-user (not IP): every logged-in user has their own budget,
 * and the listing query runs a `LIKE %..%` full scan when `search` is set.
 * 120/min is generous for typing-ahead search but caps a runaway client.
 */
export const GET = secureApi.authRateLimited(
  { bucket: "snippets-list", keyKind: "user", ...RATE_LIMITS.read },
  async (req: NextRequest) => {
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
        offset,
      });

      return NextResponse.json({
        snippets,
        pagination: {
          page,
          limit,
          hasMore: snippets.length === limit,
        },
      });
    } catch (error) {
      (await getRequestLogger({ labels: { route: "api/snippets", op: "GET" } }))
        .error({ message: "snippets GET failed", error, location: "api/snippets/GET" });
      return ApiResponses.serverError();
    }
  },
);

/**
 * Writes are per-user. Internal business cap is 3 total snippets per user,
 * enforced below; this rate-limit is an additional line of defense against
 * rapid-fire submissions that evade the cap via race conditions.
 */
export const POST = secureApi.authRateLimited(
  { bucket: "snippets-create", keyKind: "user", ...RATE_LIMITS.snippetWrite },
  async (req: NextRequest, user) => {
    try {
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
        return ApiResponses.badRequest("Kullanıcı ilerleme bilgisi bulunamadı.");
      }

      if (
        !checkStreakRequirement(userP.istikrar, "CODE_SNIPPET_SHARING", {
          codeShareUnlocked: userP.codeShareUnlocked,
        })
      ) {
        return ApiResponses.forbidden(getStreakRequirementMessage("CODE_SNIPPET_SHARING"));
      }

      const count = await getUserSnippetCount(userId);
      if (count >= 3) {
        return ApiResponses.forbidden("En fazla 3 kod parçası paylaşabilirsiniz.");
      }

      const body = await req.json();
      const { title, description, code, language } = body;

      if (!title?.trim() || !description?.trim() || !code?.trim() || !language?.trim()) {
        return ApiResponses.badRequest(
          "Tüm alanların (başlık, açıklama, kod, dil) doldurulması gerekiyor.",
        );
      }

      if (title.trim().length > 100) {
        return ApiResponses.badRequest("Başlık en fazla 100 karakter olabilir.");
      }

      if (description.trim().length > 500) {
        return ApiResponses.badRequest("Açıklama en fazla 500 karakter olabilir.");
      }

      if (code.trim().length > 10000) {
        return ApiResponses.badRequest("Kod en fazla 10.000 karakter olabilir.");
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
      {
        const log = await getRequestLogger({ labels: { route: "api/snippets", op: "POST" } });
        log.error({ message: "snippets POST failed", error: err, location: "api/snippets/POST" });
      }
      return ApiResponses.serverError();
    }
  },
);
