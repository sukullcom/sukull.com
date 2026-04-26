import { NextRequest, NextResponse } from "next/server";
import {
  GET as lessonsGET,
  PUT as lessonsPUT,
  DELETE as lessonsDELETE,
} from "../route";

/**
 * Legacy lesson URLs (`/api/lessons/:lessonId`) — kept alive as a thin
 * delegate to the consolidated handler at `/api/lessons`.
 *
 * ## Why this is NOT a 307 redirect anymore
 *
 * The previous implementation returned `NextResponse.redirect(url, 307)`
 * for PUT / DELETE. That's the canonical "preserve method and body"
 * redirect, but **some HTTP clients (notably older axios, native
 * `fetch` under certain streaming modes, and the React Admin data
 * provider this repo uses) silently drop the request body on redirect.**
 * The target handler then saw `{}` and either 400'd ("Invalid ID" /
 * "missing fields") or, worse for PUT, ran a `SET {}` update that
 * nulled nothing but still consumed an audit write. Admins reported
 * "save button does nothing" after the consolidation — this is that.
 *
 * Delegating in-process avoids the network redirect entirely: the
 * request body stream is forwarded verbatim to the consolidated
 * handler, and the client sees the final status code from this URL.
 * It is strictly a superset of the previous behaviour (same auth
 * check, same rate-limit bucket, same DB write).
 *
 * The `id` search param is set here rather than by clients so we
 * don't grow a second, parallel API contract; all write logic still
 * lives in `/api/lessons/route.ts`.
 */
function rewriteToConsolidated(request: NextRequest, action: string, lessonId: string): NextRequest {
  const url = new URL(request.url);
  url.pathname = "/api/lessons";
  url.searchParams.set("action", action);
  url.searchParams.set("id", lessonId);

  // We must reconstruct a NextRequest so the consolidated handler
  // (which reads `new URL(request.url).searchParams`) sees our
  // injected action + id. Passing `body: request.body` forwards the
  // stream without buffering; `duplex: 'half'` is required by the
  // WHATWG Request spec whenever a ReadableStream is used as body.
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const init = {
    method: request.method,
    headers: request.headers,
    ...(hasBody ? { body: request.body, duplex: "half" } : {}),
  };

  return new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } },
) {
  const id = params.lessonId;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
  }
  return lessonsGET(rewriteToConsolidated(request, "get", id));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { lessonId: string } },
) {
  const id = params.lessonId;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
  }
  return lessonsPUT(rewriteToConsolidated(request, "update-lesson", id));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { lessonId: string } },
) {
  const id = params.lessonId;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
  }
  return lessonsDELETE(rewriteToConsolidated(request, "delete-lesson", id));
}
