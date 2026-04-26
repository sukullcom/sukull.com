import { NextResponse } from "next/server"

import db from "@/db/drizzle"
import { challenges } from "@/db/schema"
import { isAdmin } from "@/lib/admin"
import { parseRangeHeader } from "@/lib/pagination"
import { sql } from "drizzle-orm"

export const GET = async (req: Request) => {
    if (!(await isAdmin())) {
        return new NextResponse("Bu işlem için yetkiniz yok.", { status: 401 })
    }

    const { start, end, limit } = parseRangeHeader(req.headers.get('Range'));

    const [{ count: totalCount }] = await db.select({
        count: sql<number>`count(*)`
    }).from(challenges);

    const total = Number(totalCount);

    const data = await db.query.challenges.findMany({
        limit: limit,
        offset: start,
        orderBy: (challenges, { desc }) => [desc(challenges.id)]
    });

    const response = NextResponse.json(data);
    response.headers.set('Content-Range', `challenges ${start}-${Math.min(end, total - 1)}/${total}`);
    response.headers.set('Access-Control-Expose-Headers', 'Content-Range');

    return response;
}

// Allow-list matches the `challenges` schema shape. Optional columns
// are accepted only when present-and-typed; unknown keys are dropped.
type ChallengeInsert = typeof challenges.$inferInsert;

export const POST = async (req: Request) => {
    if (!(await isAdmin())) {
        return new NextResponse("Bu işlem için yetkiniz yok.", { status: 401 })
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const lessonId = Number(body.lessonId);
    const order = Number(body.order);
    const type = typeof body.type === "string" ? body.type : "";
    const question = typeof body.question === "string" ? body.question : "";

    if (!Number.isFinite(lessonId) || lessonId <= 0) {
        return NextResponse.json({ error: "lessonId alanı zorunludur." }, { status: 400 });
    }
    if (!Number.isFinite(order)) {
        return NextResponse.json({ error: "order alanı zorunludur." }, { status: 400 });
    }
    if (!type) {
        return NextResponse.json({ error: "type alanı zorunludur." }, { status: 400 });
    }
    if (!question) {
        return NextResponse.json({ error: "question alanı zorunludur." }, { status: 400 });
    }

    const values: ChallengeInsert = {
        lessonId: Math.trunc(lessonId),
        order: Math.trunc(order),
        type: type as ChallengeInsert["type"],
        question,
        questionImageSrc: typeof body.questionImageSrc === "string" ? body.questionImageSrc : null,
        explanation: typeof body.explanation === "string" ? body.explanation : null,
        difficulty:
            typeof body.difficulty === "string"
                ? (body.difficulty as ChallengeInsert["difficulty"])
                : null,
        tags: typeof body.tags === "string" ? body.tags : null,
        timeLimit:
            body.timeLimit === null || body.timeLimit === undefined
                ? null
                : Number.isFinite(Number(body.timeLimit))
                    ? Math.trunc(Number(body.timeLimit))
                    : null,
        metadata: typeof body.metadata === "string" ? body.metadata : null,
    };

    const data = await db.insert(challenges).values(values).returning();

    return NextResponse.json(data[0]);
}
